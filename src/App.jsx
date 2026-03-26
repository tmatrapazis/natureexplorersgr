import './App.css'
import { Suspense } from 'react'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { lazyPagesConfig } from './pages.lazy'
import { BrowserRouter as Router, Route, Routes, Navigate, Outlet, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { TabNavigationProvider } from '@/lib/TabNavigationContext';
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

// Redirect any URL with uppercase letters to its lowercase equivalent
function LowercaseRedirect() {
  const location = useLocation();
  const lower = location.pathname.toLowerCase();
  if (lower !== location.pathname) {
    return <Navigate to={lower + location.search + location.hash} replace />;
  }
  return <Outlet />;
}

const tabRoutes = [
  { path: '/calendar', name: 'Calendar' },
  { path: '/organizerslist', name: 'Organizers' },
  { path: '/guides', name: 'Guides' },
  { path: '/greekrefuges', name: 'Refuges' },
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

// Separate component to access useLocation() inside Router context.
// No outer AnimatePresence here — the Layout component owns the page-content
// transition via its own AnimatePresence so the sidebar / bottom-nav shell
// stays mounted and never remounts on navigation.
function RoutesWithAnimation() {
  const location = useLocation();

  return (
    <Routes location={location}>
      <Route element={<LowercaseRedirect />}>
        <Route path="/" element={
          <LayoutWrapper currentPageName={mainPageKey}>
            <MainPage />
          </LayoutWrapper>
        } />
        {Object.entries(Pages).map(([path, Page]) => (
          <Route
            key={path}
            path={`/${path.toLowerCase()}`}
            element={
              <LayoutWrapper currentPageName={path}>
                <Page />
              </LayoutWrapper>
            }
          />
        ))}
        <Route path="/organizerprofile/:username" element={
          <LayoutWrapper currentPageName="OrganizerProfile">
            {Pages.OrganizerProfile ? <Pages.OrganizerProfile /> : <></>}
          </LayoutWrapper>
        } />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
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