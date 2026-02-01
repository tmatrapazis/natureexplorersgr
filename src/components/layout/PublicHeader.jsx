import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Mountain, Calendar, Users, LogIn, LogOut, Globe, User, Compass } from 'lucide-react';
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

export default function PublicHeader() {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation(language);

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
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to={createPageUrl("Home")} className="flex items-center gap-3">
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

        <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
          <Link to={createPageUrl("Calendar")} className="text-stone-700 hover:text-emerald-600 transition-colors flex items-center gap-2">
            <Calendar className="w-4 h-4" aria-hidden="true" />
            {t('navigation.calendar')}
          </Link>
          <Link to={createPageUrl("OrganizersList")} className="text-stone-700 hover:text-emerald-600 transition-colors flex items-center gap-2">
            <Users className="w-4 h-4" aria-hidden="true" />
            {t('navigation.organizers')}
          </Link>
          <Link to={createPageUrl("Guides")} className="text-stone-700 hover:text-emerald-600 transition-colors flex items-center gap-2">
            <Compass className="w-4 h-4" aria-hidden="true" />
            {t('navigation.guides')}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" aria-label="Change language">
                <Globe className="w-4 h-4 mr-2" aria-hidden="true" />
                <span className="sr-only">Select language</span>
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
            <Button onClick={handleLogin} variant="default" className="bg-emerald-600 hover:bg-emerald-700">
              <LogIn className="w-4 h-4 md:mr-2" aria-hidden="true" />
              <span className="hidden md:inline">{t('common.login')}</span>
            </Button>
          ) : (
            <Button onClick={handleLogout} variant="default" size="sm" className="bg-emerald-600 hover:bg-emerald-900">
              <LogOut className="w-4 h-4 md:mr-2" aria-hidden="true" />
              <span className="hidden md:inline">{t('common.logout')}</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}