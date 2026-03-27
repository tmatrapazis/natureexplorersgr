import React, {
  createContext, useContext, useState, useEffect,
  useRef, useCallback, useMemo,
} from 'react';
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
 * Performance notes:
 * - All exported functions use `useCallback` with stable deps (via refs) so
 *   consumers wrapped in React.memo only re-render when values they care about
 *   actually change.
 * - The context value is `useMemo`'d — a new object is only created when
 *   `currentTab`, `tabStacks`, or `canGoBack` change.
 *
 * Resilience features:
 * - tabStacks are persisted to sessionStorage so they survive iOS WebView
 *   suspend/resume cycles where the JS context may be discarded.
 * - A visibilitychange listener flushes current state when the app goes to the
 *   background, ensuring the sessionStorage copy is always fresh.
 * - Scroll positions are saved/restored against `.page-transition-layer`
 *   (the actual animated scroll host), not #root.
 */
export function TabNavigationProvider({ children, tabRoutes }) {
  const location = useLocation();
  const navigate = useNavigate();

  // ─── Tab stacks ─────────────────────────────────────────────────────────────
  // Initialise from sessionStorage when available (survives iOS app suspend).
  const [tabStacks, setTabStacks] = useState(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const valid = tabRoutes.every(r => Array.isArray(parsed[r.path]) && parsed[r.path].length > 0);
        if (valid) return parsed;
      }
    } catch { /* sessionStorage unavailable in some privacy modes */ }
    const stacks = {};
    tabRoutes.forEach(route => { stacks[route.path] = [route.path]; });
    return stacks;
  });

  // ─── Refs for latest-value access inside stable callbacks ───────────────────
  const tabStacksRef = useRef(tabStacks);
  const locationRef = useRef(location);
  const currentTabRef = useRef(/** @type {string} */(''));

  // Keep refs in sync
  useEffect(() => { tabStacksRef.current = tabStacks; }, [tabStacks]);
  useEffect(() => { locationRef.current = location; }, [location]);

  // Persist tabStacks to sessionStorage on every change
  useEffect(() => {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(tabStacks)); }
    catch { /* silent */ }
  }, [tabStacks]);

  // ─── Current active tab ──────────────────────────────────────────────────────
  const [currentTab, setCurrentTab] = useState(() => {
    const matchedTab = tabRoutes.find(tab =>
      location.pathname === tab.path || location.pathname.startsWith(tab.path + '/')
    );
    return matchedTab?.path || tabRoutes[0]?.path || '';
  });

  useEffect(() => { currentTabRef.current = currentTab; }, [currentTab]);

  // ─── Scroll positions ────────────────────────────────────────────────────────
  const scrollPositions = useRef({});

  // Helper: find the real scroll container.
  // body is position:fixed on iOS so window.scrollY is always 0.
  // The animated page-transition-layer div is the actual scroll host.
  const getScrollEl = useCallback(() => {
    const layer = document.querySelector('.page-transition-layer');
    if (layer) return layer;
    const root = document.getElementById('root');
    if (root && root.scrollHeight > root.clientHeight) return root;
    return window;
  }, []);

  // ─── Location change → update tab stack ─────────────────────────────────────
  const fullPath = location.pathname + location.search;

  useEffect(() => {
    const fullLocation = location.pathname + location.search;
    const matchedTab = tabRoutes.find(tab =>
      location.pathname === tab.path || location.pathname.startsWith(tab.path + '/')
    );

    if (matchedTab) {
      const tabPath = matchedTab.path;
      setTabStacks(prev => {
        const currentStack = prev[tabPath] || [tabPath];
        if (currentStack[currentStack.length - 1] !== fullLocation) {
          return { ...prev, [tabPath]: [...currentStack, fullLocation] };
        }
        return prev;
      });
      setCurrentTab(tabPath);
    } else {
      // Dynamic / parameterised route — attribute to active tab
      const activeTab = currentTabRef.current;
      if (activeTab) {
        setTabStacks(prev => {
          const currentStack = prev[activeTab] || [];
          if (currentStack[currentStack.length - 1] !== fullLocation) {
            return { ...prev, [activeTab]: [...currentStack, fullLocation] };
          }
          return prev;
        });
      }
    }
  }, [location.pathname, location.search, tabRoutes]);

  // ─── Scroll save/restore ─────────────────────────────────────────────────────
  // Save on unmount of current path
  useEffect(() => {
    const savedPath = fullPath;
    return () => {
      const el = getScrollEl();
      scrollPositions.current[savedPath] =
        el === window ? window.scrollY : /** @type {Element} */(el).scrollTop;
    };
  }, [fullPath, getScrollEl]);

  // Restore after navigation (50ms lets entering animation start first)
  useEffect(() => {
    const savedPosition = scrollPositions.current[fullPath];
    const id = setTimeout(() => {
      const el = getScrollEl();
      const top = savedPosition ?? 0;
      if (el === window) {
        window.scrollTo({ top, behavior: 'instant' });
      } else {
        /** @type {Element} */(el).scrollTop = top;
      }
    }, 50);
    return () => clearTimeout(id);
  }, [fullPath, getScrollEl]);

  // ─── Flush state when app goes to background (iOS WebView suspend) ───────────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const el = getScrollEl();
        const loc = locationRef.current;
        const currentFullPath = loc.pathname + loc.search;
        scrollPositions.current[currentFullPath] =
          el === window ? window.scrollY : /** @type {Element} */(el).scrollTop;
        try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(tabStacksRef.current)); }
        catch { /* silent */ }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [getScrollEl]);

  // ─── Stable public API (useCallback with ref-based deps) ────────────────────

  /**
   * Navigate to a tab.
   * - Tapping the CURRENT active tab: always resets to the tab root and clears
   *   the stack (standard iOS/Android "double-tap to go home" behaviour).
   * - Tapping a DIFFERENT tab: restores the last visited page within that tab.
   * Stable reference — does NOT change on navigation.
   */
  const navigateToTab = useCallback((tabPath) => {
    const el = getScrollEl();
    const loc = locationRef.current;
    scrollPositions.current[loc.pathname + loc.search] =
      el === window ? window.scrollY : /** @type {Element} */(el).scrollTop;

    const isCurrentTab = currentTabRef.current === tabPath;

    if (isCurrentTab) {
      // Reset to root and clear the stack
      setTabStacks(prev => ({ ...prev, [tabPath]: [tabPath] }));
      navigate(tabPath);
    } else {
      const stack = tabStacksRef.current[tabPath];
      navigate(stack?.[stack.length - 1] || tabPath);
    }
  }, [navigate, getScrollEl]);

  /**
   * Go back within the current tab's stack.
   * Stable reference — does NOT change on navigation.
   */
  const goBackInTab = useCallback(() => {
    const tab = currentTabRef.current;
    const currentStack = tabStacksRef.current[tab] || [];

    if (currentStack.length > 1) {
      const el = getScrollEl();
      const loc = locationRef.current;
      scrollPositions.current[loc.pathname + loc.search] =
        el === window ? window.scrollY : /** @type {Element} */(el).scrollTop;

      const newStack = currentStack.slice(0, -1);
      const previousPath = newStack[newStack.length - 1];
      setTabStacks(prev => ({ ...prev, [tab]: newStack }));
      navigate(previousPath);
      return true;
    }
    return false;
  }, [navigate, getScrollEl]);

  /**
   * Programmatically push a URL onto the current tab's stack.
   * Stable reference.
   */
  const pushInTab = useCallback((url) => {
    const tab = currentTabRef.current || tabRoutes[0]?.path;
    if (tab) {
      setTabStacks(prev => {
        const stack = prev[tab] || [tab];
        if (stack[stack.length - 1] !== url) {
          return { ...prev, [tab]: [...stack, url] };
        }
        return prev;
      });
    }
    navigate(url);
  }, [navigate, tabRoutes]);

  /**
   * True when the given path (default: current) is a tab root.
   * Stable reference — tabRoutes never changes at runtime.
   */
  const isTabRoot = useCallback((path = locationRef.current.pathname) => {
    return tabRoutes.some(tab => tab.path === path);
  }, [tabRoutes]);

  /** True when the current tab stack has a previous entry. */
  const canGoBack = useMemo(() => {
    return (tabStacks[currentTab] || []).length > 1;
  }, [tabStacks, currentTab]);

  // ─── Stable context value ────────────────────────────────────────────────────
  // Only creates a new object when the values that consumers actually read change.
  const value = useMemo(() => ({
    currentTab,
    tabStacks,
    navigateToTab,
    pushInTab,
    goBackInTab,
    canGoBack,
    isTabRoot,
  }), [currentTab, tabStacks, navigateToTab, pushInTab, goBackInTab, canGoBack, isTabRoot]);

  return (
    <TabNavigationContext.Provider value={value}>
      {children}
    </TabNavigationContext.Provider>
  );
}

export function useTabNavigation() {
  const context = useContext(TabNavigationContext);
  if (!context) throw new Error('useTabNavigation must be used within TabNavigationProvider');
  return context;
}
