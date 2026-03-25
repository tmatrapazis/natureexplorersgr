import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const TabNavigationContext = createContext(undefined);

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
 */
export function TabNavigationProvider({ children, tabRoutes }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Store navigation history for each tab
  const [tabStacks, setTabStacks] = useState(() => {
    const stacks = {};
    tabRoutes.forEach(route => {
      stacks[route.path] = [route.path];
    });
    return stacks;
  });

  // Track current active tab
  const [currentTab, setCurrentTab] = useState(() => {
    const matchedTab = tabRoutes.find(tab =>
      location.pathname === tab.path || location.pathname.startsWith(tab.path + '/')
    );
    return matchedTab?.path || tabRoutes[0]?.path;
  });

  // Keep a ref so effects can read currentTab without going stale
  const currentTabRef = useRef(currentTab);
  useEffect(() => {
    currentTabRef.current = currentTab;
  }, [currentTab]);

  // Store scroll positions for each full path (pathname + search)
  const scrollPositions = useRef({});

  // Helper: build the full path string used as stack entry key
  const fullPath = location.pathname + location.search;

  // Update tab stack when location changes
  useEffect(() => {
    const fullLocation = location.pathname + location.search;

    const matchedTab = tabRoutes.find(tab =>
      location.pathname === tab.path || location.pathname.startsWith(tab.path + '/')
    );

    if (matchedTab) {
      // Navigation is within a known tab — update that tab's stack
      const tabPath = matchedTab.path;

      setTabStacks(prev => {
        const currentStack = prev[tabPath] || [tabPath];
        const lastInStack = currentStack[currentStack.length - 1];
        // Deduplicate: only add if the incoming path differs from top of stack
        if (lastInStack !== fullLocation) {
          return {
            ...prev,
            [tabPath]: [...currentStack, fullLocation],
          };
        }
        return prev;
      });

      setCurrentTab(tabPath);
    } else {
      // Dynamic / parameterised route (e.g. /TripDetails?id=…, /OrganizerProfile/:username)
      // — attribute it to whichever tab was active when the user navigated here
      const activeTab = currentTabRef.current;
      if (activeTab) {
        setTabStacks(prev => {
          const currentStack = prev[activeTab] || [];
          const lastInStack = currentStack[currentStack.length - 1];
          // Deduplicate: pushInTab may have already added this entry
          if (lastInStack !== fullLocation) {
            return {
              ...prev,
              [activeTab]: [...currentStack, fullLocation],
            };
          }
          return prev;
        });
      }
      // currentTab intentionally not changed — user is still "in" the same tab
    }
  }, [location.pathname, location.search, tabRoutes]);

  // Helper: get the real scroll container.
  // body is position:fixed on iOS so window.scrollY is always 0.
  // All page scrolling happens on #root instead.
  const getScrollEl = () => document.getElementById('root') || window;

  // Save scroll position before navigating away from current path
  useEffect(() => {
    const savedPath = fullPath;
    return () => {
      const el = getScrollEl();
      scrollPositions.current[savedPath] =
        el === window ? window.scrollY : el.scrollTop;
    };
  }, [fullPath]);

  // Restore scroll position after navigation
  useEffect(() => {
    const savedPosition = scrollPositions.current[fullPath];
    // Use setTimeout to ensure DOM is ready before scrolling
    const id = setTimeout(() => {
      const el = getScrollEl();
      const top = savedPosition ?? 0;
      if (el === window) {
        window.scrollTo(0, top);
      } else {
        el.scrollTop = top;
      }
    }, 0);
    return () => clearTimeout(id);
  }, [fullPath]);

  /**
   * Navigate to a tab, restoring its last known screen and scroll position.
   */
  const navigateToTab = (tabPath) => {
    // Save current scroll position before leaving
    const el = getScrollEl();
    scrollPositions.current[fullPath] =
      el === window ? window.scrollY : el.scrollTop;

    const stack = tabStacks[tabPath];
    const targetPath = stack?.[stack.length - 1] || tabPath;
    navigate(targetPath);
  };

  /**
   * Go back within the current tab's stack, preserving scroll position.
   */
  const goBackInTab = () => {
    const tab = currentTabRef.current;
    const currentStack = tabStacks[tab] || [];

    if (currentStack.length > 1) {
      // Save current scroll position
      const el = getScrollEl();
      scrollPositions.current[fullPath] =
        el === window ? window.scrollY : el.scrollTop;

      const newStack = currentStack.slice(0, -1);
      const previousPath = newStack[newStack.length - 1];

      // Update the stack first so the location-change effect sees the right state
      setTabStacks(prev => ({
        ...prev,
        [tab]: newStack,
      }));

      navigate(previousPath);
      return true;
    }

    return false;
  };

  /**
   * Boolean: true when the current tab's stack has a previous entry to go back to.
   * Memoised so consuming components only re-render when the value actually changes.
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
   * Use this when a plain <Link> cannot be used (e.g. imperative navigation).
   * The duplicate check in the location-change effect ensures the path is not
   * added twice if both pushInTab and the effect run for the same URL.
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