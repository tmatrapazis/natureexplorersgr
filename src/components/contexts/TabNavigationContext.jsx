import React, { createContext, useContext, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * Stack-based navigation context.
 * Each "tab" (root URL segment) maintains its own history stack.
 * This enables proper back-button support on iOS without
 * relying on the browser's native history (unreliable in PWA/webview).
 */

const TabNavigationContext = createContext(null);

export function TabNavigationProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Map of tabRoot -> stack of paths
  const stacks = useRef({});
  const currentTab = useRef(null);

  // Derive the "tab root" from a pathname — first segment after "/"
  const getTabRoot = useCallback((pathname) => {
    const segment = pathname.split("/").filter(Boolean)[0] || "home";
    return "/" + segment;
  }, []);

  // Navigate to a tab root — resets or initialises that tab's stack
  const navigateToTab = useCallback((url) => {
    const root = getTabRoot(url);
    // Reset stack to just the root when tapping the tab button
    stacks.current[root] = [url];
    currentTab.current = root;
    navigate(url);
  }, [navigate, getTabRoot]);

  // Push within the current tab (e.g. drilling into a detail page)
  const pushInTab = useCallback((url) => {
    const root = currentTab.current || getTabRoot(location.pathname);
    const stack = stacks.current[root] || [location.pathname];
    stacks.current[root] = [...stack, url];
    currentTab.current = root;
    navigate(url);
  }, [navigate, location.pathname, getTabRoot]);

  // Go back within the current tab's stack
  const goBackInTab = useCallback(() => {
    const root = currentTab.current || getTabRoot(location.pathname);
    const stack = stacks.current[root] || [];
    if (stack.length > 1) {
      const newStack = stack.slice(0, -1);
      stacks.current[root] = newStack;
      navigate(newStack[newStack.length - 1]);
    } else {
      // Fallback: go to the tab root instead of relying on browser history
      navigate(root === "/home" ? "/" : root);
    }
  }, [navigate, location.pathname, getTabRoot]);

  // Whether we can go back in the current tab
  const canGoBack = useCallback(() => {
    const root = currentTab.current || getTabRoot(location.pathname);
    const stack = stacks.current[root] || [];
    return stack.length > 1;
  }, [location.pathname, getTabRoot]);

  // Whether we're at the root of the current tab
  const isTabRoot = useCallback(() => {
    const root = currentTab.current || getTabRoot(location.pathname);
    const stack = stacks.current[root] || [];
    return stack.length <= 1;
  }, [location.pathname, getTabRoot]);

  return (
    <TabNavigationContext.Provider value={{ navigateToTab, pushInTab, goBackInTab, canGoBack, isTabRoot }}>
      {children}
    </TabNavigationContext.Provider>
  );
}

export function useTabNavigation() {
  const ctx = useContext(TabNavigationContext);
  if (!ctx) {
    return {
      navigateToTab: () => {},
      pushInTab: () => {},
      goBackInTab: () => {},
      canGoBack: () => false,
      isTabRoot: () => true,
    };
  }
  return ctx;
}