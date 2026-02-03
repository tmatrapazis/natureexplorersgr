import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Globe, LogOut, Menu, Home, Calendar, Users, Compass } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import PublicHeader from "./components/layout/PublicHeader";
import PublicFooter from "./components/layout/PublicFooter";
import { LanguageProvider, useLanguage } from "./components/contexts/LanguageContext";
import { useTranslation } from "./components/translations/useTranslations";
import GoogleAnalytics from "./components/analytics/GoogleAnalytics";
import WelcomeModal from "./components/welcome/WelcomeModal";

const LoggedInLayout = ({ children, user }) => {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation(language);
  const [showWelcome, setShowWelcome] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    // Show welcome modal if user hasn't accepted terms
    if (user && !user.has_accepted_terms) {
      setShowWelcome(true);
    }
  }, [user]);

  const handleLogout = () => {
    base44.auth.logout(createPageUrl("Home"));
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      {showWelcome && user && (
        <WelcomeModal 
          user={user} 
          onClose={() => setShowWelcome(false)} 
        />
      )}
      
      <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
        <div className="w-full py-4 pl-5 pr-5">
          <div className="flex items-center justify-between gap-8">
            {/* Logo on the left */}
            <Link to={createPageUrl("Home")} className="flex items-center gap-3 flex-shrink-0">
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

            {/* Desktop Navigation in center */}
            <nav className="hidden md:flex items-center gap-8 flex-1 justify-center">
              <Link to={createPageUrl("Calendar")} className="text-stone-700 hover:text-emerald-600 transition-colors font-medium">
                {t('navigation.calendar')}
              </Link>
              <Link to={createPageUrl("OrganizersList")} className="text-stone-700 hover:text-emerald-600 transition-colors font-medium">
                {t('navigation.organizers')}
              </Link>
              <Link to={createPageUrl("Guides")} className="text-stone-700 hover:text-emerald-600 transition-colors font-medium">
                {t('navigation.guides')}
              </Link>
              <Link to={createPageUrl("GreekRefuges")} className="text-stone-700 hover:text-emerald-600 transition-colors font-medium">
                {t('navigation.refuges')}
              </Link>
            </nav>

            {/* Desktop Actions on the right */}
            <div className="hidden md:flex items-center gap-3 flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Globe className="w-4 h-4 mr-2" />
                    <span>{language === 'en' ? 'EN' : 'ΕΛ'}</span>
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
                <LogOut className="w-4 h-4 mr-2" />
                <span>{t('common.logout')}</span>
              </Button>
            </div>

            {/* Mobile Hamburger Menu */}
            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="w-6 h-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] bg-white">
                  <div className="flex flex-col gap-6 mt-8">
                    <Link 
                      to={createPageUrl("Calendar")} 
                      className="text-stone-700 hover:text-emerald-600 transition-colors text-lg flex items-center gap-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Calendar className="w-5 h-5" />
                      {t('navigation.calendar')}
                    </Link>
                    <Link 
                      to={createPageUrl("OrganizersList")} 
                      className="text-stone-700 hover:text-emerald-600 transition-colors text-lg flex items-center gap-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Users className="w-5 h-5" />
                      {t('navigation.organizers')}
                    </Link>
                    <Link 
                      to={createPageUrl("Guides")} 
                      className="text-stone-700 hover:text-emerald-600 transition-colors text-lg flex items-center gap-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Compass className="w-5 h-5" />
                      {t('navigation.guides')}
                    </Link>
                    <Link 
                      to={createPageUrl("GreekRefuges")} 
                      className="text-stone-700 hover:text-emerald-600 transition-colors text-lg flex items-center gap-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Home className="w-5 h-5" />
                      {t('navigation.refuges')}
                    </Link>

                    <div className="border-t pt-6">
                      <div className="mb-4">
                        <p className="text-sm text-stone-500 mb-2">{language === 'el' ? 'Γλώσσα' : 'Language'}</p>
                        <div className="flex gap-2">
                          <Button 
                            variant={language === 'en' ? 'default' : 'outline'} 
                            size="sm"
                            onClick={() => setLanguage('en')}
                            className="flex-1"
                          >
                            English
                          </Button>
                          <Button 
                            variant={language === 'el' ? 'default' : 'outline'} 
                            size="sm"
                            onClick={() => setLanguage('el')}
                            className="flex-1"
                          >
                            Ελληνικά
                          </Button>
                        </div>
                      </div>

                      <Button 
                        onClick={handleLogout}
                        variant="outline"
                        className="w-full"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        {t('common.logout')}
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
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