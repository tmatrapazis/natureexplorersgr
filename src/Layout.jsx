import React from "react";
import { useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import PublicHeader from "./components/layout/PublicHeader";
import PublicFooter from "./components/layout/PublicFooter";
import AppLayout from "./components/layout/Layout";
import { LanguageProvider } from "./components/contexts/LanguageContext";
import GoogleAnalytics from "./components/analytics/GoogleAnalytics";
import WelcomeModal from "./components/welcome/WelcomeModal";
import CookieConsent from "./components/cookie/CookieConsent";

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
  const [showWelcome, setShowWelcome] = React.useState(false);

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        // Show welcome modal if user hasn't accepted terms
        if (currentUser && !currentUser.has_accepted_terms) {
          setShowWelcome(true);
        }
      } catch (error) {
        setUser(null);
        console.log('[Layout] User not authenticated');
      }
    };
    fetchUser();
  }, [location.pathname]);

  const isOrganizer = user?.organizer_code && user.organizer_code.trim().length > 0;

  // Home page always uses PublicLayout
  if (currentPageName === 'Home') {
    return <PublicLayout>{children}</PublicLayout>;
  }

  // All other pages use AppLayout with sidebar
  return (
    <>
      {showWelcome && user && (
        <WelcomeModal 
          user={user} 
          onClose={() => setShowWelcome(false)} 
        />
      )}
      <AppLayout user={user} isOrganizer={isOrganizer} location={location}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </AppLayout>
    </>
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