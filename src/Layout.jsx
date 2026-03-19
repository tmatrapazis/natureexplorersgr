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
import { TabNavigationProvider } from "./components/contexts/TabNavigationContext";
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

  console.log('🟢 [Layout] Rendering LayoutContent for page:', currentPageName, 'path:', location.pathname);

  const { data: user, isLoading: userLoading, error: userError, isError } = useQuery({
    queryKey: ['current-user'], // Unified with EditProfile for cache consistency
    queryFn: async () => {
      console.log('🔵 [Layout] Fetching current user via base44.auth.me()...');
      try {
        const userData = await base44.auth.me();
        console.log('✅ [Layout] User data fetched successfully:', {
          id: userData?.id,
          email: userData?.email,
          username: userData?.username,
          has_accepted_terms: userData?.has_accepted_terms,
          organizer_code: userData?.organizer_code
        });
        return userData;
      } catch (error) {
        console.error('❌ [Layout] Failed to fetch user:', error);
        throw error;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
  });

  // Handle errors from user query
  React.useEffect(() => {
    if (isError && userError) {
      console.error('🔴 [Layout] User query error:', userError);
      // Only show toast for actual auth errors, not for logged-out users
      if ((/** @type {any} */(userError)).status && (/** @type {any} */(userError)).status !== 401 && (/** @type {any} */(userError)).status !== 403) {
        toast.error('Failed to load user session. Please refresh the page.');
      }
    }
  }, [isError, userError]);

  // Handle successful auth check completion
  React.useEffect(() => {
    if (!userLoading && user) {
      console.log('🟢 [Layout] User query success, user loaded:', user?.email || 'no email');
      setAuthCheckComplete(true);
    }
  }, [userLoading, user]);

  // Handle auth check completion even when no user (logged out)
  React.useEffect(() => {
    if (!userLoading && !user && !isError) {
      console.log('ℹ️  [Layout] No user logged in (public visitor)');
      setAuthCheckComplete(true);
    } else if (isError) {
      console.log('⚠️  [Layout] Auth error occurred, marking as complete');
      setAuthCheckComplete(true);
    }
  }, [userLoading, user, isError]);

  // Show welcome modal for new users who haven't accepted terms
  React.useEffect(() => {
    if (user && !user?.has_accepted_terms) {
      console.log('🎉 [Layout] New user detected, showing welcome modal');
      setShowWelcome(true);
    } else if (user && user?.has_accepted_terms) {
      console.log('✓ [Layout] User has accepted terms, no welcome modal needed');
    }
  }, [user]);

  // Check for incomplete profile and redirect to EditProfile
  React.useEffect(() => {
    if (user && authCheckComplete) {
      const isProfileIncomplete = !user?.username || user?.username.trim() === '';
      const isOnEditProfilePage = location.pathname.includes('/EditProfile');
      const isOnRoleSelectionPage = location.pathname.includes('/RoleSelection');
      
      if (isProfileIncomplete && !isOnEditProfilePage && !isOnRoleSelectionPage) {
        console.log('⚠️  [Layout] User profile incomplete (missing username), redirecting to EditProfile');
        console.log('📋 [Layout] User data:', { username: user?.username, email: user?.email });
        toast.info('Please complete your profile to continue');
        navigate(createPageUrl('EditProfile'));
      } else if (isProfileIncomplete) {
        console.log('ℹ️  [Layout] User on EditProfile/RoleSelection page with incomplete profile - allowing');
      } else {
        console.log('✓ [Layout] User profile complete (username:', user?.username, ')');
      }
    }
  }, [user, authCheckComplete, location.pathname, navigate]);

  const isOrganizer = user?.organizer_code && user?.organizer_code.trim().length > 0;
  
  if (isOrganizer) {
    console.log('👤 [Layout] User is an organizer:', user?.organizer_code);
  } else if (user) {
    console.log('👤 [Layout] User is a regular user/hiker');
  }

  // Show loading state while checking auth
  if (userLoading && !authCheckComplete) {
    console.log('⏳ [Layout] Loading user data...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-stone-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          <p className="mt-4 text-stone-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (currentPageName === 'Home') {
    console.log('🏠 [Layout] Rendering public layout for Home page');
    return <PublicLayout>{children}</PublicLayout>;
  }

  console.log('📄 [Layout] Rendering app layout for:', currentPageName);
  
  return (
    <>
      {showWelcome && user && (
        <WelcomeModal 
          user={user} 
          onClose={() => {
            console.log('✓ [Layout] Welcome modal closed');
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
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname + location.search}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ willChange: "transform, opacity" }}
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

  console.log('🎯 [Layout] Main Layout component rendering for page:', currentPageName);

  const handleConsentChange = (preferences) => {
    console.log('🍪 [Layout] Cookie consent changed:', preferences);
    setAnalyticsEnabled(preferences.analytics);
  };

  return (
    <LanguageProvider>
      <TabNavigationProvider>
        <GoogleAnalytics enabled={analyticsEnabled} />
        {currentPageName !== 'TripDetails' && <CookieConsent onConsentChange={handleConsentChange} />}
        <LayoutContent children={children} currentPageName={currentPageName} />
      </TabNavigationProvider>
    </LanguageProvider>
  );
}