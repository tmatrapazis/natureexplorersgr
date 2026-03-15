import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Mountain, Calendar, Users, LogIn, LogOut, Globe, User, Compass, Menu, Home, Info } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../translations/useTranslations';
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

  const { data: user } = useQuery({
    queryKey: ['current-user-public-header'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const handleLogin = () => {
    base44.auth.redirectToLogin(window.location.pathname);
  };

  const handleLogout = () => {
    base44.auth.logout(createPageUrl("Home"));
  };

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
      <div className="w-full py-4 pl-5 pr-5">
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
              <h1 className="font-bold text-xl text-stone-900">{t('header.app_name')}</h1>
              <p className="text-xs text-stone-500">{t('header.tagline')}</p>
            </div>
          </Link>

          {/* Desktop Navigation in center */}
          <nav className="hidden md:flex items-center gap-8 flex-1 justify-center" aria-label="Main navigation">
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
            <Link to="/About" className="text-stone-700 hover:text-emerald-600 transition-colors font-medium">
              {language === 'el' ? 'Σχετικά' : 'About'}
            </Link>
          </nav>

          {/* Desktop Actions on the right */}
          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" aria-label="Change language">
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
              <Button onClick={handleLogin} variant="outline" size="sm">
                <LogIn className="w-4 h-4 mr-2" aria-hidden="true" />
                <span>{t('common.login')}</span>
              </Button>
            ) : (
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-2" aria-hidden="true" />
                <span>{t('common.logout')}</span>
              </Button>
            )}
          </div>

          {/* Mobile Hamburger Menu */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" aria-label="Open menu">
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
                  <Link 
                    to="/About" 
                    className="text-stone-700 hover:text-emerald-600 transition-colors text-lg flex items-center gap-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Info className="w-5 h-5" />
                    {language === 'el' ? 'Σχετικά' : 'About'}
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

                    {!user ? (
                      <Button 
                        onClick={handleLogin}
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                      >
                        <LogIn className="w-4 h-4 mr-2" />
                        {t('common.login')}
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleLogout}
                        variant="outline"
                        className="w-full"
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