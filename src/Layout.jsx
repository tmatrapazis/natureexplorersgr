import React from "react";
import { useLocation, useNavigate, useNavigationType } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
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
import { useTabNavigation } from "@/lib/TabNavigationContext";

// ─── Transition config ────────────────────────────────────────────────────────
// Defined outside the component so the reference is stable across renders.
const PAGE_TRANSITION = { duration: 0.24, ease: [0.4, 0, 0.2, 1] };
const PAGE_STYLE = {
  position: 'absolute',
  top: 0, left: 0, right: 0, bottom: 0,
  overflowY: 'auto',
  WebkitOverflowScrolling: 'touch',
  overscrollBehavior: 'contain',
  paddingBottom: 'max(env(safe-area-inset-bottom), 4rem)',
  willChange: 'transform',
};

// ─── Public (marketing) layout ────────────────────────────────────────────────
const PublicLayout = React.memo(function PublicLayout({ children }) {
  const location = useLocation();
  const navType = useNavigationType();
  const navDir = navType === 'POP' ? -1 : 1;
  const pageKey = location.pathname + location.search;

  return (
    <div className="flex flex-col min-h-screen">
      <PublicHeader />
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={pageKey}
            initial={{ x: `${navDir * 60}%`, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: `${navDir * -20}%`, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            style={{ willChange: 'transform, opacity', minHeight: '100%' }}
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>
      <PublicFooter />
    </div>
  );
});

// ─── App (authenticated) layout ───────────────────────────────────────────────
function LayoutContent({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const navType = useNavigationType();
  const { isTabRoot } = useTabNavigation();
  const [showWelcome, setShowWelcome] = React.useState(false);
  const [authCheckComplete, setAuthCheckComplete] = React.useState(false);

  const pageKey = location.pathname + location.search;

  /**
   * Three distinct animation flavours:
   *
   *  1. POP (back gesture / goBackInTab)
   *     → current page exits to the RIGHT, previous slides in from the LEFT
   *     → mirrors iOS "swipe back" feel
   *
   *  2. PUSH to a tab-root (bottom-nav tab switch, e.g. Calendar → Guides)
   *     → cross-fade only — no horizontal shift
   *     → mirrors iOS tab-bar behaviour: tabs are peers, not a hierarchy
   *
   *  3. PUSH to a child page (e.g. Calendar → TripDetails)
   *     → child enters from the RIGHT, previous exits to the LEFT
   *     → standard iOS push transition
   */
  const anim = React.useMemo(() => {
    if (navType === 'POP') {
      return {
        initial: { x: '-30%', opacity: 0 },
        animate: { x: 0,      opacity: 1 },
        exit:    { x:  '30%', opacity: 0 },
        transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] },
      };
    }
    if (isTabRoot(location.pathname)) {
      // Tab switch — pure cross-fade, no horizontal motion
      return {
        initial:    { opacity: 0 },
        animate:    { opacity: 1 },
        exit:       { opacity: 0 },
        transition: { duration: 0.16, ease: 'easeInOut' },
      };
    }
    // Child page push
    return {
      initial:    { x: '100%' },
      animate:    { x: 0,      opacity: 1 },
      exit:       { x: '-20%', opacity: 0 },
      transition: PAGE_TRANSITION,
    };
  }, [navType, location.pathname, isTabRoot]);

  const { user, isLoadingAuth: userLoading } = useAuth();

  // Mark auth check done when loading settles
  React.useEffect(() => {
    if (!userLoading) setAuthCheckComplete(true);
  }, [userLoading]);

  // Show welcome modal for new users
  React.useEffect(() => {
    if (user && !user?.has_accepted_terms) setShowWelcome(true);
  }, [user]);

  // Redirect to EditProfile when profile is incomplete
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

  const isOrganizer = !!(user?.organizer_code && user.organizer_code.trim().length > 0);

  const handleCloseWelcome = React.useCallback(() => setShowWelcome(false), []);

  // Loading state
  if (userLoading && !authCheckComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-gold/40 to-stone-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-dark" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {showWelcome && user && (
        <WelcomeModal user={user} onClose={handleCloseWelcome} />
      )}
      <AppLayout
        currentPageName={currentPageName}
        user={user}
        isOrganizer={isOrganizer}
        location={location}
      >
        {/*
          position:absolute + overflow-y:auto on the motion.div makes it the
          scroll host so slide-transitions never cause horizontal overflow.
        */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pageKey}
            initial={anim.initial}
            animate={anim.animate}
            exit={anim.exit}
            transition={anim.transition}
            style={PAGE_STYLE}
            className="scrollbar-hide page-transition-layer"
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

  const handleConsentChange = React.useCallback((preferences) => {
    setAnalyticsEnabled(preferences.analytics);
  }, []);

  return (
    <LanguageProvider>
      <GoogleAnalytics enabled={analyticsEnabled} />
      {currentPageName !== 'TripDetails' && (
        <CookieConsent onConsentChange={handleConsentChange} />
      )}
      <LayoutContent currentPageName={currentPageName}>{children}</LayoutContent>
    </LanguageProvider>
  );
}
