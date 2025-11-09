
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Globe, LogOut } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PublicHeader from "./components/layout/PublicHeader";
import PublicFooter from "./components/layout/PublicFooter";
import { LanguageProvider, useLanguage } from "./components/contexts/LanguageContext";
import { useTranslation } from "./components/translations/useTranslations";
import GoogleAnalytics from "./components/analytics/GoogleAnalytics";

const LoggedInLayout = ({ children, user }) => {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation(language);

  const handleLogout = () => {
    base44.auth.logout(createPageUrl("Home"));
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to={createPageUrl("Home")} className="flex items-center gap-3">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68edfeced35e3590d79eccb8/01040e5a0_logo.png" 
              alt="Nature Explorers" 
              className="h-10 w-auto" 
            />
            <div>
              <h1 className="font-bold text-xl text-stone-900">{t('header.app_name')}</h1>
              <p className="text-xs text-stone-500">{t('header.tagline')}</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link to={createPageUrl("Calendar")} className="text-stone-700 hover:text-emerald-600 transition-colors flex items-center gap-2">
              <span>{t('navigation.calendar')}</span>
            </Link>
            <Link to={createPageUrl("OrganizersList")} className="text-stone-700 hover:text-emerald-600 transition-colors flex items-center gap-2">
              <span>{t('navigation.organizers')}</span>
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Globe className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">{language === 'en' ? 'EN' : 'ΕΛ'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setLanguage('en')}>
                  English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('el')}>
                  Ελληνικά
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              onClick={handleLogout}
              variant="outline"
              size="sm"
            >
              <LogOut className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">{t('common.logout')}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <PublicFooter />
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

  const publicPages = ['Home', 'OrganizersList', 'Calendar', 'TripDetails', 'OrganizerProfile'];

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
