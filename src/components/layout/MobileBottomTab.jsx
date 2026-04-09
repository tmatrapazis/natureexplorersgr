import React from "react";
import { useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Calendar } from "lucide-react";
import { useTabNavigation } from "@/lib/TabNavigationContext";

export default function MobileBottomTab({ user }) {
  const location = useLocation();
  const { navigateToTab } = useTabNavigation();
  
  const tabs = [
    { name: "Home", icon: Home, path: createPageUrl("Home"), pageName: "Home" },
    { name: "Calendar", icon: Calendar, path: createPageUrl("Calendar"), pageName: "Calendar" },
  ];

  const isActive = (pageName) => location.pathname === createPageUrl(pageName);

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 select-none"
      role="tablist"
      aria-label="Main navigation"
      style={{ 
        paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)',
        paddingTop: '0.5rem'
      }}
    >
      <div className="flex items-center justify-around px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.pageName);
          
          return (
            <button
              key={tab.name}
              role="tab"
              aria-selected={active}
              aria-label={`Navigate to ${tab.name}`}
              onClick={() => navigateToTab(tab.path)}
              className={`flex flex-col items-center justify-center py-2 px-4 min-h-[44px] min-w-[44px] transition-colors rounded-lg ${
                active 
                  ? "text-brand-dark dark:text-brand-gold" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-6 h-6 mb-1" aria-hidden="true" />
              <span className="text-xs font-medium">{tab.name}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}