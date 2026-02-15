import React from "react";
import { useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import PublicHeader from "./components/layout/PublicHeader";
import PublicFooter from "./components/layout/PublicFooter";
import MobileBottomTab from "./components/layout/MobileBottomTab";
import { LanguageProvider } from "./components/contexts/LanguageContext";
import GoogleAnalytics from "./components/analytics/GoogleAnalytics";
import WelcomeModal from "./components/welcome/WelcomeModal";
import CookieConsent from "./components/cookie/CookieConsent";

const LoggedInLayout = ({ children, user }) => {
  const location = useLocation();
  const [showWelcome, setShowWelcome] = React.useState(false);

  React.useEffect(() => {
    // Show welcome modal if user hasn't accepted terms
    if (user && !user.has_accepted_terms) {
      setShowWelcome(true);
    }
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col bg-background pb-16 md:pb-0">
      {showWelcome && user && (
        <WelcomeModal 
          user={user} 
          onClose={() => setShowWelcome(false)} 
        />
      )}
      
      <PublicHeader />

      <AnimatePresence mode="wait">
        <motion.main 
          key={location.pathname}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="flex-1"
        >
          {children}
        </motion.main>
      </AnimatePresence>

      <PublicFooter />
      
      {user && <MobileBottomTab user={user} />}
    </div>
  );
};

const PublicLayout = ({ children }) => {
  const location = useLocation();
  
  return (
    <div className="flex flex-col min-h-screen">
      <PublicHeader />
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="flex-1"
        >
          {children}
        </motion.main>
      </AnimatePresence>
      <PublicFooter />
    </div>
  );
};

function LayoutContent({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.log('[Layout] User not authenticated');
      }
    };
    fetchUser();
  }, []);

  const publicPages = ['Home', 'OrganizersList', 'Calendar', 'TripDetails', 'OrganizerProfile', 'TermsOfUse'];

  if (currentPageName === 'Home') {
    return <PublicLayout>{children}</PublicLayout>;
  }

  if (publicPages.includes(currentPageName) && !user) {
    return <PublicLayout>{children}</PublicLayout>;
  }

  // User is logged in
  return (
    <LoggedInLayout user={user}>
      {children}
    </LoggedInLayout>
  );
}

export default function Layout({ children, currentPageName }) {
  const [analyticsEnabled, setAnalyticsEnabled] = React.useState(false);

  const handleConsentChange = (preferences) => {
    setAnalyticsEnabled(preferences.analytics);
  };

  return (
    <LanguageProvider>
      <GoogleAnalytics enabled={analyticsEnabled} />
      <CookieConsent onConsentChange={handleConsentChange} />
      <LayoutContent children={children} currentPageName={currentPageName} />
    </LanguageProvider>
  );
}