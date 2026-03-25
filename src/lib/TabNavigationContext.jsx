import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const TabNavigationContext = createContext(undefined);

/** sessionStorage key for persisting tab stacks across iOS app suspend/resume */
const SESSION_KEY = 'ne_tab_stacks';

/**
 * TabNavigationProvider
 *
 * Manages persistent navigation stacks for each bottom tab.
 * When switching tabs, the previous tab's history is preserved.
 * Child pages (including dynamic routes like /TripDetails?id=… and
 * /OrganizerProfile/:username) are automatically attributed to whichever
 * tab was active when the user navigated to them, so the back-button
 * always returns to the correct screen.
 *
 * Stack entries use the full path including query-string (pathname + search)
 * so that parametrised pages like TripDetails restore to the right item.
 *
 * Resilience features:
 * - tabStacks are persisted to sessionStorage so they survive iOS WebView
 *   suspend/resume cycles where the JS context may be discarded.
 * - A visibilitychange listener flushes current state when the app goes
 *   to the background, ensuring the sessionStorage copy is always fresh.
 * - Scroll positions are saved/restored against the `.page-transition-layer`
 *   element (the actual scroll host in the animated layout), not #root.
 */
export function TabNavigationProvider({ children, tabRoutes }) {
  const location = useLocation();
  const navigate = useNavigate();

  // ─── Tab stacks ────────────────────────────────────────────────────────────
  // Initialise from sessionStorage when available (survives iOS app suspend).
  const [tabStacks, setTabStacks] = useState(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate: every expected tab must have an array entry
        const valid = tabRoutes.every(r => Array.isArray(parsed[r.path]) && parsed[r.path].length > 0);
        if (valid) return parsed;
      }
    } catch {
      // sessionStorage may be unavailable in some privacy modes — silent fallback
    }
    const stacks = {};
    tabRoutes.forEach(route => {
      stacks[route.path] = [route.path];
    });
    return stacks;
  });

  // Keep a ref so closures (visibilitychange, scroll save) always read latest value
  const tabStacksRef = useRef(tabStacks);
  useEffect(() => {
    tabStacksRef.current = tabStacks;
    // Sync to sessionStorage on every change
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(tabStacks));
    } catch {
      // silent — sessionStorage failure is non-fatal
    }
  }, [tabStacks]);

  // ─── Current active tab ────────────────────────────────────────────────────
  const [currentTab, setCurrentTab] = useState(() => {
    const matchedTab = tabRoutes.find(tab =>
      location.pathname === tab.path || location.pathname.startsWith(tab.path + '/')
    );
    return matchedTab?.path || tabRoutes[0]?.path;
  });

  const currentTabRef = useRef(currentTab);
  useEffect(() => {
    currentTabRef.current = currentTab;
  }, [currentTab]);

  // ─── Scroll positions ──────────────────────────────────────────────────────
  const scrollPositions = useRef({});

  // Keep a ref for the current location so async handlers never capture stale state
  const locationRef = useRef(location);
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  // Helper: find the real scroll container.
  //
  // The layout uses a position:absolute motion.div as the scroll host
  // (class="page-transition-layer").  body is position:fixed on iOS so
  // window.scrollY is always 0, and #root is overflow:hidden during transitions.
  // Query the page-transition-layer first; fall back through #root → window.
  const getScrollEl = () => {
    const layer = document.querySelector('.page-transition-layer');
    if (layer) return layer;
    const root = document.getElementById('root');
    if (root && root.scrollHeight > root.clientHeight) return root;
    return window;
  };

  // ─── Location change → update tab stack ───────────────────────────────────
  useEffect(() => {
    const fullLocation = location.pathname + location.search;

    const matchedTab = tabRoutes.find(tab =>
      location.pathname === tab.path || location.pathname.startsWith(tab.path + '/')
    );

    if (matchedTab) {
      const tabPath = matchedTab.path;
      setTabStacks(prev => {
        const currentStack = prev[tabPath] || [tabPath];
        const lastInStack = currentStack[currentStack.length - 1];
        if (lastInStack !== fullLocation) {
          return { ...prev, [tabPath]: [...currentStack, fullLocation] };
        }
        return prev;
      });
      setCurrentTab(tabPath);
    } else {
      // Dynamic / parameterised route — attribute to whichever tab was active
      const activeTab = currentTabRef.current;
      if (activeTab) {
        setTabStacks(prev => {
          const currentStack = prev[activeTab] || [];
          const lastInStack = currentStack[currentStack.length - 1];
          if (lastInStack !== fullLocation) {
            return { ...prev, [activeTab]: [...currentStack, fullLocation] };
          }
          return prev;
        });
      }
    }
  }, [location.pathname, location.search, tabRoutes]);

  // ─── Scroll save / restore ─────────────────────────────────────────────────
  const fullPath = location.pathname + location.search;

  // Save scroll position when navigating away from the current path.
  // Use a cleanup function so it fires when the path changes.
  useEffect(() => {
    const savedPath = fullPath;
    return () => {
      const el = getScrollEl();
      scrollPositions.current[savedPath] =
        el === window ? window.scrollY : el.scrollTop;
    };
  }, [fullPath]); // eslint-disable-line react-hooks/exhaustive-deps

  // Restore scroll position after navigation.
  // A short delay ensures the new page's DOM is ready before we set scrollTop.
  useEffect(() => {
    const savedPosition = scrollPositions.current[fullPath];
    const id = setTimeout(() => {
      const el = getScrollEl();
      const top = savedPosition ?? 0;
      if (el === window) {
        window.scrollTo({ top, behavior: 'instant' });
      } else {
        el.scrollTop = top;
      }
    }, 50); // 50ms gives the entering animation a head-start before scroll restore
    return () => clearTimeout(id);
  }, [fullPath]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Flush state when app goes to background (iOS WebView suspend) ─────────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Save current scroll position immediately
        const el = getScrollEl();
        const loc = locationRef.current;
        const currentFullPath = loc.pathname + loc.search;
        scrollPositions.current[currentFullPath] =
          el === window ? window.scrollY : el.scrollTop;

        // Flush tab stacks to sessionStorage
        try {
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(tabStacksRef.current));
        } catch {
          // silent
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Public API ────────────────────────────────────────────────────────────

  /**
   * Navigate to a tab, restoring its last known screen and scroll position.
   */
  const navigateToTab = (tabPath) => {
    const el = getScrollEl();
    scrollPositions.current[fullPath] =
      el === window ? window.scrollY : el.scrollTop;

    const stack = tabStacks[tabPath];
    const targetPath = stack?.[stack.length - 1] || tabPath;
    navigate(targetPath);
  };

  /**
   * Go back within the current tab's stack, preserving scroll position.
   * Returns true if a back navigation occurred, false if already at tab root.
   */
  const goBackInTab = () => {
    const tab = currentTabRef.current;
    const currentStack = tabStacks[tab] || [];

    if (currentStack.length > 1) {
      const el = getScrollEl();
      scrollPositions.current[fullPath] =
        el === window ? window.scrollY : el.scrollTop;

      const newStack = currentStack.slice(0, -1);
      const previousPath = newStack[newStack.length - 1];

      setTabStacks(prev => ({ ...prev, [tab]: newStack }));
      navigate(previousPath);
      return true;
    }

    return false;
  };

  /**
   * Boolean: true when the current tab's stack has a previous entry.
   */
  const canGoBack = React.useMemo(() => {
    const currentStack = tabStacks[currentTab] || [];
    return currentStack.length > 1;
  }, [tabStacks, currentTab]);

  /**
   * Check if the given path (default: current location) is a tab root page.
   */
  const isTabRoot = (path = location.pathname) => {
    return tabRoutes.some(tab => tab.path === path);
  };

  /**
   * Programmatically push a URL onto the current tab's stack.
   * Use this for imperative navigation where a plain <Link> cannot be used.
   */
  const pushInTab = (url) => {
    const tab = currentTabRef.current || tabRoutes[0]?.path;
    if (tab) {
      setTabStacks(prev => {
        const stack = prev[tab] || [tab];
        const lastInStack = stack[stack.length - 1];
        if (lastInStack !== url) {
          return { ...prev, [tab]: [...stack, url] };
        }
        return prev;
      });
    }
    navigate(url);
  };

  const value = {
    currentTab,
    tabStacks,
    navigateToTab,
    pushInTab,
    goBackInTab,
    canGoBack,
    isTabRoot,
  };

  return (
    <TabNavigationContext.Provider value={value}>
      {children}
    </TabNavigationContext.Provider>
  );
}

export function useTabNavigation() {
  const context = useContext(TabNavigationContext);
  if (!context) {
    throw new Error('useTabNavigation must be used within TabNavigationProvider');
  }
  return context;
}
