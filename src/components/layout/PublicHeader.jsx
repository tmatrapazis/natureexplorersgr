import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Calendar, Users, LogIn, LogOut, Compass, Menu, Home, Info } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../translations/useTranslations';
import { useTabNavigation } from '@/lib/TabNavigationContext';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import DesktopHeader from './DesktopHeader';

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
    <>
      {/* Desktop header — reuses the shared DesktopHeader component (md+) */}
      <DesktopHeader />

      {/* Mobile-only header */}
      <header
        className="md:hidden bg-[#0c281c] sticky top-0 z-50"
        style={{
          paddingTop: 'max(env(safe-area-inset-top), 0.5rem)',
        }}
      >
        <div
          className="flex items-center justify-between py-3"
          style={{
            paddingLeft: 'max(env(safe-area-inset-left), 1.25rem)',
            paddingRight: 'max(env(safe-area-inset-right), 1.25rem)',
          }}
        >
          {/* Logo */}
          <Link to={createPageUrl('Home')} className="flex items-center gap-2 min-h-[44px]" aria-label="Nature Explorers — Home">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68edfeced35e3590d79eccb8/01040e5a0_logo.png"
              alt={language === 'el'
                ? 'Nature Explorers λογότυπο'
                : 'Nature Explorers logo'}
              className="h-8 w-auto"
            />
            <span
              className="font-bold text-[#f0e3c7] text-base"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Nature Explorers
            </span>
          </Link>

          {/* Hamburger */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="min-h-[44px] min-w-[44px] text-[#f0e3c7] hover:bg-[#f0e3c7]/10"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] bg-[#0c281c] border-l border-[#f0e3c7]/10">
              <VisuallyHidden>
                <SheetTitle>Navigation Menu</SheetTitle>
                <SheetDescription>Main navigation links</SheetDescription>
              </VisuallyHidden>
              <div className="flex flex-col gap-5 mt-8">
                <Link
                  to={createPageUrl('Calendar')}
                  onClick={handleNavClick(createPageUrl('Calendar'))}
                  className="text-[#f0e3c7] hover:text-[#8B6914] transition-colors text-base flex items-center gap-3 min-h-[44px]"
                  aria-label={t('navigation.calendar')}
                >
                  <Calendar className="w-5 h-5" aria-hidden="true" />
                  {t('navigation.calendar')}
                </Link>
                <Link
                  to={createPageUrl('OrganizersList')}
                  onClick={handleNavClick(createPageUrl('OrganizersList'))}
                  className="text-[#f0e3c7] hover:text-[#8B6914] transition-colors text-base flex items-center gap-3 min-h-[44px]"
                  aria-label={t('navigation.organizers')}
                >
                  <Users className="w-5 h-5" aria-hidden="true" />
                  {t('navigation.organizers')}
                </Link>
                <Link
                  to={createPageUrl('Guides')}
                  onClick={handleNavClick(createPageUrl('Guides'))}
                  className="text-[#f0e3c7] hover:text-[#8B6914] transition-colors text-base flex items-center gap-3 min-h-[44px]"
                  aria-label={t('navigation.guides')}
                >
                  <Compass className="w-5 h-5" aria-hidden="true" />
                  {t('navigation.guides')}
                </Link>
                <Link
                  to={createPageUrl('GreekRefuges')}
                  onClick={handleNavClick(createPageUrl('GreekRefuges'))}
                  className="text-[#f0e3c7] hover:text-[#8B6914] transition-colors text-base flex items-center gap-3 min-h-[44px]"
                  aria-label={t('navigation.refuges')}
                >
                  <Home className="w-5 h-5" aria-hidden="true" />
                  {t('navigation.refuges')}
                </Link>
                <Link
                  to="/about"
                  onClick={handleNavClick('/about')}
                  className="text-[#f0e3c7] hover:text-[#8B6914] transition-colors text-base flex items-center gap-3 min-h-[44px]"
                  aria-label={language === 'el' ? 'Σχετικά με εμάς' : 'About us'}
                >
                  <Info className="w-5 h-5" aria-hidden="true" />
                  {language === 'el' ? 'Σχετικά' : 'About'}
                </Link>

                <div className="border-t border-[#f0e3c7]/20 pt-5">
                  <p className="text-sm text-[#f0e3c7]/60 mb-3">{language === 'el' ? 'Γλώσσα' : 'Language'}</p>
                  <div className="flex gap-2 mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLanguage('en')}
                      className={`flex-1 min-h-[44px] border-[#f0e3c7]/40 text-[#f0e3c7] hover:bg-[#f0e3c7]/10 ${language === 'en' ? 'bg-[#f0e3c7]/10' : 'bg-transparent'}`}
                      aria-label="Switch to English"
                      aria-pressed={language === 'en'}
                    >
                      English
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLanguage('el')}
                      className={`flex-1 min-h-[44px] border-[#f0e3c7]/40 text-[#f0e3c7] hover:bg-[#f0e3c7]/10 ${language === 'el' ? 'bg-[#f0e3c7]/10' : 'bg-transparent'}`}
                      aria-label="Αλλαγή σε Ελληνικά"
                      aria-pressed={language === 'el'}
                    >
                      Ελληνικά
                    </Button>
                  </div>

                  {!user ? (
                    <Button
                      onClick={handleLogin}
                      className="w-full min-h-[44px] bg-[#8B6914] text-[#0c281c] hover:bg-[#8B6914]/90 font-bold"
                      style={{ fontFamily: 'var(--font-heading)' }}
                      aria-label={t('common.login')}
                    >
                      <LogIn className="w-4 h-4 mr-2" aria-hidden="true" />
                      {t('common.login')}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleLogout}
                      variant="outline"
                      className="w-full min-h-[44px] border-[#f0e3c7]/40 text-[#f0e3c7] hover:bg-[#f0e3c7]/10"
                      aria-label={t('common.logout')}
                    >
                      <LogOut className="w-4 h-4 mr-2" aria-hidden="true" />
                      {t('common.logout')}
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>
    </>
  );
}
