import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";
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
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
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
  const navigate = useNavigate();
  const [showWelcome, setShowWelcome] = React.useState(false);
  const [authCheckComplete, setAuthCheckComplete] = React.useState(false);


  
  // Global page transition key for AnimatePresence
  const pageKey = location.pathname + location.search;

  const { data: user, isLoading: userLoading, error: userError, isError } = useQuery({
    queryKey: ['current-user'], // Unified with EditProfile for cache consistency
    queryFn: () => base44.auth.me(),
    retry: false,
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
  });

  // Handle errors from user query
  React.useEffect(() => {
    if (isError && userError) {

  // Handle successful auth check completion
  React.useEffect(() => {
    if (!userLoading && user) {
      setAuthCheckComplete(true);
    }
  }, [userLoading, user]);

  // Handle auth check completion even when no user (logged out)
  React.useEffect(() => {
    if (!userLoading && (!user || isError)) {
      setAuthCheckComplete(true);
    }
  }, [userLoading, user, isError]);

  // Show welcome modal for new users who haven't accepted terms
  React.useEffect(() => {
    if (user && !user?.has_accepted_terms) {
      setShowWelcome(true);
    }
  }, [user]);

  // Check for incomplete profile and redirect to EditProfile
  React.useEffect(() => {
    if (user && authCheckComplete) {
      const isProfileIncomplete = !user?.username || user?.username.trim() === '';
      const isOnEditProfilePage = location.pathname.includes('/EditProfile');
      const isOnRoleSelectionPage = location.pathname.includes('/RoleSelection');
      
      if (isProfileIncomplete && !isOnEditProfilePage && !isOnRoleSelectionPage) {
        toast.info('Please complete your profile to continue');
        navigate(createPageUrl('EditProfile'));
      }
    }
  }, [user, authCheckComplete, location.pathname, navigate]);

  const isOrganizer = user?.organizer_code && user?.organizer_code.trim().length > 0;

  // Show loading state while checking auth
  if (userLoading && !authCheckComplete) {
    console.log('⏳ [Layout] Loading user data...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-stone-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (currentPageName === 'Home') {
    return <PublicLayout>{children}</PublicLayout>;
  }
  
  return (
    <>
      {showWelcome && user && (
        <WelcomeModal 
          user={user} 
          onClose={() => {
            setShowWelcome(false);
          }} 
        />
      )}
      <AppLayout 
        currentPageName={currentPageName} 
        user={user} 
        isOrganizer={isOrganizer} 
        location={location}
      >
        {children}
      </AppLayout>
    </>
  );
}

export default function Layout({ children, currentPageName }) {
  const [analyticsEnabled, setAnalyticsEnabled] = React.useState(false);

  const handleConsentChange = (preferences) => {
    console.log('🍪 [Layout] Cookie consent changed:', preferences);
    setAnalyticsEnabled(preferences.analytics);
  };

  return (
    <LanguageProvider>
      <GoogleAnalytics enabled={analyticsEnabled} />
      {currentPageName !== 'TripDetails' && <CookieConsent onConsentChange={handleConsentChange} />}
      <LayoutContent children={children} currentPageName={currentPageName} />
    </LanguageProvider>
  );
}