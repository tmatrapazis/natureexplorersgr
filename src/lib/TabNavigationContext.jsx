import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const TabNavigationContext = createContext(undefined);

/**
 * TabNavigationProvider
 * 
 * Manages persistent navigation stacks for each bottom tab.
 * When switching tabs, the previous tab's history is preserved.
 * Child pages show back buttons that navigate within their tab's stack.
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

  // Store scroll positions for each path
  const scrollPositions = useRef({});

  // Update tab stack when location changes
  useEffect(() => {
    const matchedTab = tabRoutes.find(tab => 
      location.pathname === tab.path || location.pathname.startsWith(tab.path + '/')
    );

    if (matchedTab) {
      const tabPath = matchedTab.path;
      
      setTabStacks(prev => {
        const currentStack = prev[tabPath] || [tabPath];
        const lastInStack = currentStack[currentStack.length - 1];
        
        // Only add to stack if it's a new path
        if (lastInStack !== location.pathname) {
          return {
            ...prev,
            [tabPath]: [...currentStack, location.pathname]
          };
        }
        
        return prev;
      });

      setCurrentTab(tabPath);
    }
  }, [location.pathname, tabRoutes]);

  // Save scroll position before navigation
  useEffect(() => {
    return () => {
      scrollPositions.current[location.pathname] = window.scrollY;
    };
  }, [location.pathname]);

  // Restore scroll position after navigation
  useEffect(() => {
    const savedPosition = scrollPositions.current[location.pathname];
    if (savedPosition !== undefined) {
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        window.scrollTo(0, savedPosition);
      }, 0);
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  /**
   * Navigate to a tab, restoring its last known position and scroll state
   */
  const navigateToTab = (tabPath) => {
    // Save current scroll position
    scrollPositions.current[location.pathname] = window.scrollY;
    
    const stack = tabStacks[tabPath];
    const targetPath = stack?.[stack.length - 1] || tabPath;
    navigate(targetPath);
  };

  /**
   * Go back within the current tab's stack, preserving scroll position
   */
  const goBackInTab = () => {
    const currentStack = tabStacks[currentTab] || [];
    
    if (currentStack.length > 1) {
      // Save current scroll position
      scrollPositions.current[location.pathname] = window.scrollY;
      
      // Navigate to previous page in stack
      const newStack = currentStack.slice(0, -1);
      const previousPath = newStack[newStack.length - 1];
      
      setTabStacks(prev => ({
        ...prev,
        [currentTab]: newStack
      }));
      
      navigate(previousPath);
      return true;
    }
    
    return false;
  };

  /**
   * Check if current page can go back within tab
   */
  const canGoBack = () => {
    const currentStack = tabStacks[currentTab] || [];
    return currentStack.length > 1;
  };

  /**
   * Check if current path is a tab root
   */
  const isTabRoot = (path = location.pathname) => {
    return tabRoutes.some(tab => tab.path === path);
  };

  const value = {
    currentTab,
    tabStacks,
    navigateToTab,
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