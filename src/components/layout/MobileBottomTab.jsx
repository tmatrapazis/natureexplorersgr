import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Calendar, BookOpen, User } from "lucide-react";

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
    },
    { 
      name: "Bookings", 
      icon: BookOpen, 
      path: createPageUrl("MyBookings"),
      pageName: "MyBookings"
    },
    { 
      name: "Profile", 
      icon: User, 
      path: createPageUrl("MyProfile"),
      pageName: "MyProfile"
    }
  ];

  const isActive = (pageName) => {
    return location.pathname === createPageUrl(pageName);
  };

  const handleTabClick = (e, tab) => {
    const active = isActive(tab.pageName);
    
    // If already on this tab, navigate to root of that section
    if (active) {
      e.preventDefault();
      navigate(tab.path, { replace: true });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 select-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
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