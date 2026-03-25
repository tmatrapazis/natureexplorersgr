import './App.css'
import { Suspense } from 'react'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { lazyPagesConfig } from './pages.lazy'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { TabNavigationProvider } from '@/lib/TabNavigationContext';
import { AnimatePresence } from 'framer-motion';

// All pages are lazy-loaded via pages.lazy.js — no eager About import needed here
const { Pages, Layout, mainPage } = lazyPagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const LoadingFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
  </div>
);

const tabRoutes = [
  { path: '/Calendar', name: 'Calendar' },
  { path: '/OrganizersList', name: 'Organizers' },
  { path: '/Guides', name: 'Guides' },
  { path: '/GreekRefuges', name: 'Refuges' },
];

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-border border-t-foreground rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Suspense fallback={<LoadingFallback />}>
      <TabNavigationProvider tabRoutes={tabRoutes}>
        <RoutesWithAnimation />
      </TabNavigationProvider>
    </Suspense>
  );
};

// Page transition variants — native-like slide in/out
const pageVariants = {
  initial: { opacity: 0, x: '100%' },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: '-30%' },
};

const pageTransition = {
  duration: 0.28,
  ease: [0.25, 0.46, 0.45, 0.94],
};

const PageWrapper = ({ children }) => (
  <motion.div
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    transition={pageTransition}
    style={{ willChange: 'transform, opacity', height: '100%', width: '100%', position: 'relative' }}
  >
    {children}
  </motion.div>
);

// Separate component to access useLocation() inside Router context
function RoutesWithAnimation() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <LayoutWrapper currentPageName={mainPageKey}>
            <PageWrapper><MainPage /></PageWrapper>
          </LayoutWrapper>
        } />
        {Object.entries(Pages).map(([path, Page]) => (
          <Route
            key={path}
            path={`/${path}`}
            element={
              <LayoutWrapper currentPageName={path}>
                <PageWrapper><Page /></PageWrapper>
              </LayoutWrapper>
            }
          />
        ))}
        <Route path="/OrganizerProfile/:username" element={
          <LayoutWrapper currentPageName="OrganizerProfile">
            <PageWrapper>{Pages.OrganizerProfile ? <Pages.OrganizerProfile /> : <></>}</PageWrapper>
          </LayoutWrapper>
        } />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </AnimatePresence>
  );
}


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App