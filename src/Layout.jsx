import React from "react";
import { useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PublicHeader from "./components/layout/PublicHeader";
import PublicFooter from "./components/layout/PublicFooter";
import MobileBottomTab from "./components/layout/MobileBottomTab";
import { LanguageProvider } from "./components/contexts/LanguageContext";
import GoogleAnalytics from "./components/analytics/GoogleAnalytics";
import WelcomeModal from "./components/welcome/WelcomeModal";

const LoggedInLayout = ({ children, user }) => {
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

      <main className="flex-1">
        {children}
      </main>

      <PublicFooter />
      
      {user && <MobileBottomTab user={user} />}
    </div>
  );
};

const PublicLayout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <PublicHeader />
      <main className="flex-1">{children}</main>
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
  return (
    <LanguageProvider>
      <GoogleAnalytics />
      <LayoutContent children={children} currentPageName={currentPageName} />
    </LanguageProvider>
  );
}