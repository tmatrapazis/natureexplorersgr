import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Calendar } from "lucide-react";

export default function MobileBottomTab({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  const tabs = [
    { 
      name: "Home", 
      icon: Home, 
      path: createPageUrl("Home"),
      pageName: "Home"
    },
    { 
      name: "Calendar", 
      icon: Calendar, 
      path: createPageUrl("Calendar"),
      pageName: "Calendar"
    }
  ];

  const isActive = (pageName) => {
    return location.pathname === createPageUrl(pageName);
  };

  const handleTabClick = (e, tab) => {
    // No auto-scroll behavior
  };

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 select-none"
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
            <Link
              key={tab.name}
              to={tab.path}
              onClick={(e) => handleTabClick(e, tab)}
              className={`flex flex-col items-center justify-center py-2 px-4 min-h-[44px] min-w-[44px] transition-colors ${
                active 
                  ? "text-emerald-600 dark:text-emerald-400" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}