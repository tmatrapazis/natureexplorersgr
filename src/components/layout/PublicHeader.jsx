import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Mountain, Calendar, Users, LogIn, LogOut, Globe, User, Compass, Menu, Home, Info } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../translations/useTranslations';
import { useTabNavigation } from '@/lib/TabNavigationContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';

export default function PublicHeader() {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation(language);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { pushInTab } = useTabNavigation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogin = () => {
    navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };
  
  const handleNavClick = (url) => (e) => {
    e.preventDefault();
    pushInTab(url);
    setMobileMenuOpen(false);
  };

  return (
    <header 
      className="bg-background border-b border-border sticky top-0 z-50"
      style={{ 
        paddingTop: 'max(env(safe-area-inset-top), 0.5rem)'
      }}
    >
      <div 
        className="w-full py-4"
        style={{ 
          paddingLeft: 'max(env(safe-area-inset-left), 1.25rem)',
          paddingRight: 'max(env(safe-area-inset-right), 1.25rem)'
        }}
      >
        <div className="flex items-center justify-between gap-8">
          {/* Logo on the left */}
          <Link to={createPageUrl("Home")} className="flex items-center gap-3 flex-shrink-0">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68edfeced35e3590d79eccb8/01040e5a0_logo.png" 
              alt={language === 'el' 
                ? "Nature Explorers - Πεζοπορία Ελλάδα - Ορειβασία - Hiking Greece λογότυπο"
                : "Nature Explorers - Hiking Greece - Trekking - Outdoor Activities logo"} 
              className="h-10 w-auto" 
            />
            <div>
              <h1 className="font-bold text-xl text-foreground">{t('header.app_name')}</h1>
              <p className="text-xs text-muted-foreground">{t('header.tagline')}</p>
            </div>
          </Link>

          {/* Desktop Navigation in center */}
          <nav className="hidden md:flex items-center gap-8 flex-1 justify-center" aria-label="Main navigation">
            <Link 
              to={createPageUrl("Calendar")} 
              onClick={handleNavClick(createPageUrl("Calendar"))}
              className="text-foreground hover:text-emerald-600 transition-colors font-medium"
              aria-label={t('navigation.calendar')}
            >
              {t('navigation.calendar')}
            </Link>
            <Link 
              to={createPageUrl("OrganizersList")} 
              onClick={handleNavClick(createPageUrl("OrganizersList"))}
              className="text-foreground hover:text-emerald-600 transition-colors font-medium"
              aria-label={t('navigation.organizers')}
            >
              {t('navigation.organizers')}
            </Link>
            <Link 
              to={createPageUrl("Guides")} 
              onClick={handleNavClick(createPageUrl("Guides"))}
              className="text-foreground hover:text-emerald-600 transition-colors font-medium"
              aria-label={t('navigation.guides')}
            >
              {t('navigation.guides')}
            </Link>
            <Link 
              to={createPageUrl("GreekRefuges")} 
              onClick={handleNavClick(createPageUrl("GreekRefuges"))}
              className="text-foreground hover:text-emerald-600 transition-colors font-medium"
              aria-label={t('navigation.refuges')}
            >
              {t('navigation.refuges')}
            </Link>
            <Link 
              to="/about" 
              onClick={handleNavClick("/about")}
              className="text-foreground hover:text-emerald-600 transition-colors font-medium"
              aria-label={language === 'el' ? 'Σχετικά με εμάς' : 'About us'}
            >
              {language === 'el' ? 'Σχετικά' : 'About'}
            </Link>
          </nav>

          {/* Desktop Actions on the right */}
          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="min-h-[44px]"
                  aria-label={`Change language (current: ${language === 'en' ? 'English' : 'Greek'})`}
                >
                  <Globe className="w-4 h-4 mr-2" aria-hidden="true" />
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
            
            {!user ? (
              <Button 
                onClick={handleLogin} 
                variant="outline" 
                size="sm"
                className="min-h-[44px]"
                aria-label={t('common.login')}
              >
                <LogIn className="w-4 h-4 mr-2" aria-hidden="true" />
                <span>{t('common.login')}</span>
              </Button>
            ) : (
              <Button 
                onClick={handleLogout} 
                variant="outline" 
                size="sm"
                className="min-h-[44px]"
                aria-label={t('common.logout')}
              >
                <LogOut className="w-4 h-4 mr-2" aria-hidden="true" />
                <span>{t('common.logout')}</span>
              </Button>
            )}
          </div>

          {/* Mobile Hamburger Menu */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="min-h-[44px] min-w-[44px]"
                  aria-label="Open menu"
                >
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] bg-background">
                <div className="flex flex-col gap-6 mt-8">
                  <Link 
                    to={createPageUrl("Calendar")} 
                    onClick={handleNavClick(createPageUrl("Calendar"))}
                    className="text-foreground hover:text-emerald-600 transition-colors text-lg flex items-center gap-2 min-h-[44px]"
                    aria-label={t('navigation.calendar')}
                  >
                    <Calendar className="w-5 h-5" aria-hidden="true" />
                    {t('navigation.calendar')}
                  </Link>
                  <Link 
                    to={createPageUrl("OrganizersList")} 
                    onClick={handleNavClick(createPageUrl("OrganizersList"))}
                    className="text-foreground hover:text-emerald-600 transition-colors text-lg flex items-center gap-2 min-h-[44px]"
                    aria-label={t('navigation.organizers')}
                  >
                    <Users className="w-5 h-5" aria-hidden="true" />
                    {t('navigation.organizers')}
                  </Link>
                  <Link 
                    to={createPageUrl("Guides")} 
                    onClick={handleNavClick(createPageUrl("Guides"))}
                    className="text-foreground hover:text-emerald-600 transition-colors text-lg flex items-center gap-2 min-h-[44px]"
                    aria-label={t('navigation.guides')}
                  >
                    <Compass className="w-5 h-5" aria-hidden="true" />
                    {t('navigation.guides')}
                  </Link>
                  <Link 
                    to={createPageUrl("GreekRefuges")} 
                    onClick={handleNavClick(createPageUrl("GreekRefuges"))}
                    className="text-foreground hover:text-emerald-600 transition-colors text-lg flex items-center gap-2 min-h-[44px]"
                    aria-label={t('navigation.refuges')}
                  >
                    <Home className="w-5 h-5" aria-hidden="true" />
                    {t('navigation.refuges')}
                  </Link>
                  <Link 
                    to="/about" 
                    onClick={handleNavClick("/about")}
                    className="text-foreground hover:text-emerald-600 transition-colors text-lg flex items-center gap-2 min-h-[44px]"
                    aria-label={language === 'el' ? 'Σχετικά με εμάς' : 'About us'}
                  >
                    <Info className="w-5 h-5" aria-hidden="true" />
                    {language === 'el' ? 'Σχετικά' : 'About'}
                  </Link>

                  <div className="border-t pt-6">
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-2">{language === 'el' ? 'Γλώσσα' : 'Language'}</p>
                      <div className="flex gap-2">
                        <Button 
                          variant={language === 'en' ? 'default' : 'outline'} 
                          size="sm"
                          onClick={() => setLanguage('en')}
                          className="flex-1 min-h-[44px]"
                          aria-label="Switch to English"
                        >
                          English
                        </Button>
                        <Button 
                          variant={language === 'el' ? 'default' : 'outline'} 
                          size="sm"
                          onClick={() => setLanguage('el')}
                          className="flex-1 min-h-[44px]"
                          aria-label="Αλλαγή σε Ελληνικά"
                        >
                          Ελληνικά
                        </Button>
                      </div>
                    </div>

                    {!user ? (
                      <Button 
                        onClick={handleLogin}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
                        aria-label={t('common.login')}
                      >
                        <LogIn className="w-4 h-4 mr-2" />
                        {t('common.login')}
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleLogout}
                        variant="outline"
                        className="w-full min-h-[44px]"
                        aria-label={t('common.logout')}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        {t('common.logout')}
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}