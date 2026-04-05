import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Globe, LogIn, LogOut, User } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../translations/useTranslations';
import { useTabNavigation } from '@/lib/TabNavigationContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import NotificationsBell from './NotificationsBell';

const NAV_LINKS = [
  { key: 'navigation.calendar',   page: 'Calendar' },
  { key: 'navigation.organizers', page: 'OrganizersList' },
  { key: 'navigation.guides',     page: 'Guides' },
  { key: 'navigation.refuges',    page: 'GreekRefuges' },
];

export default function DesktopHeader() {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation(language);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { pushInTab } = useTabNavigation();

  const isOrganizer = !!(user?.organizer_code && user.organizer_code.trim().length > 0);

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
  };

  const isActive = (page) => {
    const url = createPageUrl(page);
    return location.pathname.startsWith(url.split('?')[0]);
  };

  return (
    <header className="hidden md:flex items-center h-16 bg-[#0c281c] sticky top-0 z-50 px-6 gap-8 shadow-md">
      {/* Logo + Brand */}
      <Link
        to={createPageUrl('Home')}
        className="flex items-center gap-3 flex-shrink-0 min-h-[44px]"
        aria-label="Nature Explorers — Home"
      >
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68edfeced35e3590d79eccb8/01040e5a0_logo.png"
          alt="Nature Explorers logo"
          className="h-8 w-auto"
        />
        <span
          className="font-bold text-[#f0e3c7] text-lg tracking-tight"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Nature Explorers
        </span>
      </Link>

      {/* Nav Links */}
      <nav className="flex items-center gap-6 flex-1" aria-label="Primary navigation">
        {NAV_LINKS.map(({ key, page }) => {
          const url = createPageUrl(page);
          const active = isActive(page);
          return (
            <Link
              key={page}
              to={url}
              onClick={handleNavClick(url)}
              className={`text-sm font-medium transition-colors min-h-[44px] flex items-center pb-0.5 ${
                active
                  ? 'text-[#f0e3c7] border-b-2 border-[#8B6914]'
                  : 'text-[#f0e3c7]/75 hover:text-[#f0e3c7]'
              }`}
              style={{ fontFamily: 'var(--font-heading)' }}
              aria-label={t(key)}
              aria-current={active ? 'page' : undefined}
            >
              {t(key)}
            </Link>
          );
        })}
        <Link
          to="/about"
          onClick={handleNavClick('/about')}
          className={`text-sm font-medium transition-colors min-h-[44px] flex items-center pb-0.5 ${
            location.pathname === '/about'
              ? 'text-[#f0e3c7] border-b-2 border-[#8B6914]'
              : 'text-[#f0e3c7]/75 hover:text-[#f0e3c7]'
          }`}
          style={{ fontFamily: 'var(--font-heading)' }}
          aria-label={language === 'el' ? 'Σχετικά με εμάς' : 'About us'}
          aria-current={location.pathname === '/about' ? 'page' : undefined}
        >
          {language === 'el' ? 'Σχετικά' : 'About'}
        </Link>
        {isOrganizer && (
          <Link
            to={createPageUrl('MyTrips')}
            onClick={handleNavClick(createPageUrl('MyTrips'))}
            className={`text-sm font-medium transition-colors min-h-[44px] flex items-center pb-0.5 ${
              isActive('MyTrips')
                ? 'text-[#f0e3c7] border-b-2 border-[#8B6914]'
                : 'text-[#f0e3c7]/75 hover:text-[#f0e3c7]'
            }`}
            style={{ fontFamily: 'var(--font-heading)' }}
            aria-label="Dashboard"
            aria-current={isActive('MyTrips') ? 'page' : undefined}
          >
            Dashboard
          </Link>
        )}
      </nav>

      {/* Right-side actions */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Language switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-1.5 text-[#f0e3c7]/80 hover:text-[#f0e3c7] text-sm font-medium min-h-[44px] px-2 transition-colors"
              aria-label={`Change language (current: ${language === 'en' ? 'English' : 'Greek'})`}
            >
              <Globe className="w-4 h-4" aria-hidden="true" />
              <span>{language === 'en' ? 'EN' : 'ΕΛ'}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setLanguage('en')}>English</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLanguage('el')}>Ελληνικά</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications (authenticated only) */}
        {user && (
          <div className="text-[#f0e3c7]">
            <NotificationsBell user={user} compact />
          </div>
        )}

        {/* Auth */}
        {!user ? (
          <button
            onClick={handleLogin}
            className="flex items-center gap-2 min-h-[44px] px-5 py-2 rounded-full text-sm font-medium bg-[#8B6914] text-[#0c281c] hover:bg-[#8B6914]/90 transition-colors"
            style={{ fontFamily: 'var(--font-heading)' }}
            aria-label={t('common.login')}
          >
            <LogIn className="w-4 h-4" aria-hidden="true" />
            {t('common.login')}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to={createPageUrl('EditProfile')}
              className="flex items-center gap-2 text-[#f0e3c7]/80 hover:text-[#f0e3c7] transition-colors min-h-[44px]"
              aria-label="View profile"
            >
              {user.profile_picture_url ? (
                <img
                  src={user.profile_picture_url}
                  alt={`${user.username || 'User'} profile`}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <User className="w-5 h-5" aria-hidden="true" />
              )}
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-[#f0e3c7]/70 hover:text-[#f0e3c7] text-sm min-h-[44px] px-2 transition-colors"
              aria-label={t('common.logout')}
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Book a Trip CTA */}
        <Link
          to={createPageUrl('Calendar')}
          onClick={handleNavClick(createPageUrl('Calendar'))}
          className="flex items-center min-h-[44px] px-5 py-2 rounded-full text-sm font-bold bg-[#8B6914] text-[#0c281c] hover:bg-[#8B6914]/90 transition-colors ml-1"
          style={{ fontFamily: 'var(--font-heading)' }}
          aria-label={language === 'el' ? 'Βρες εκδρομή' : 'Book a Trip'}
        >
          {language === 'el' ? 'Βρες εκδρομή' : 'Book a Trip'}
        </Link>
      </div>
    </header>
  );
}
