import React, { useCallback, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Calendar, PlusCircle, Map, User, LogOut, Edit, Users, Compass, Home,
  LogIn, X, ArrowLeft, ClipboardList, BookOpen, BarChart2, Sparkles,
  Backpack, Menu,
} from "lucide-react";
import DesktopHeader from "./DesktopHeader";
import { useTabNavigation } from "@/lib/TabNavigationContext";
import { useBackNavigation } from "@/lib/useBackNavigation";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useTranslation } from "../translations/useTranslations";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import PublicHeader from "../layout/PublicHeader";
import PublicFooter from "../layout/PublicFooter";
import NotificationsBell from "../layout/NotificationsBell";

// Nav URLs are stable constants — titles are resolved inside the component with t()
const CLIENT_NAV_URLS = [
  { key: "navigation.my_bookings", url: createPageUrl("MyBookings"), icon: ClipboardList },
  { key: "navigation.edit_profile", url: createPageUrl("EditProfile"), icon: Edit },
];

const ORGANIZER_NAV_URLS = [
  { key: "navigation.create_trip",     url: createPageUrl("TripForm"),          icon: PlusCircle },
  { key: "navigation.my_trips",        url: createPageUrl("MyTrips"),            icon: Map },
  { key: "navigation.manage_bookings", url: createPageUrl("ManageBookings"),     icon: BookOpen },
  { key: "navigation.analytics",       url: createPageUrl("OrganizerAnalytics"), icon: BarChart2 },
  { key: "navigation.plans",           url: createPageUrl("OrganizerPlans"),     icon: Sparkles },
  { key: "navigation.edit_profile",    url: createPageUrl("EditProfile"),        icon: Edit },
];

// ─── BottomNav — self-contained, reads all context internally ────────────────
const BottomNav = React.memo(function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const { navigateToTab } = useTabNavigation();

  const pathname = location.pathname;
  const isOrganizer = !!(user?.organizer_code && user.organizer_code.trim().length > 0);

  const myPackUrl = isOrganizer ? createPageUrl("MyTrips") : createPageUrl("MyBookings");
  const myPackLabel = isOrganizer ? t('navigation.my_trips') : t('navigation.my_bookings');
  const fabUrl = isOrganizer ? createPageUrl("TripForm") : createPageUrl("Calendar");

  const tabs = [
    { icon: Compass,  label: t('navigation.calendar'),   url: createPageUrl("Calendar"),       matchPrefix: '/calendar' },
    { icon: Map,      label: t('navigation.refuges'),    url: createPageUrl("GreekRefuges"),   matchPrefix: '/greekrefuges' },
    null, // FAB placeholder
    { icon: Users,    label: t('navigation.organizers'), url: createPageUrl("OrganizersList"), matchPrefix: '/organizerslist' },
    { icon: Backpack, label: myPackLabel,                url: myPackUrl,                       matchPrefix: user && isOrganizer ? '/mytrips' : '/mybookings' },
  ];

  return (
    <nav
      aria-label="Main navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 bg-brand-dark z-50 select-none shadow-lg"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)' }}
    >
      <div className="flex items-end justify-around px-2 h-16">
        {tabs.map((tab) => {
          if (tab === null) {
            return (
              <button
                key="fab"
                onClick={() => navigateToTab(fabUrl)}
                className="relative flex flex-col items-center justify-center -mt-6"
                aria-label={isOrganizer ? t('navigation.create_trip') : t('navigation.calendar')}
              >
                <div className="w-14 h-14 rounded-full bg-brand-gold-accent text-brand-dark shadow-lg flex items-center justify-center">
                  <PlusCircle className="w-7 h-7" aria-hidden="true" />
                </div>
              </button>
            );
          }
          const Icon = tab.icon;
          const isActive = pathname.startsWith(tab.matchPrefix);
          return (
            <button
              key={tab.url}
              onClick={() => navigateToTab(tab.url)}
              className="flex flex-col items-center justify-center pt-2 pb-1 px-2 min-h-[48px] min-w-[48px] transition-colors flex-1"
              aria-label={`Navigate to ${tab.label}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className={`w-1 h-1 rounded-full mb-1 ${isActive ? 'bg-brand-gold-accent' : 'bg-transparent'}`} aria-hidden="true" />
              <div className={`flex flex-col items-center justify-center rounded-full px-3 py-1 transition-colors ${isActive ? 'bg-brand-gold/10' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-brand-gold' : 'text-brand-gold/70'}`} aria-hidden="true" />
                <span
                  className={`text-[10px] mt-0.5 font-medium ${isActive ? 'text-brand-gold' : 'text-brand-gold/70'}`}
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {tab.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
});

// ─── AppLayoutInner — no Sidebar dependency, custom mobile Sheet ──────────────
const AppLayoutInner = React.memo(function AppLayoutInner({ children, isOrganizer, user, location }) {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation(language);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { isTabRoot, navigateToTab } = useTabNavigation();
  const { showBackButton, backLabel, goBack: goBackInTab } = useBackNavigation(null);

  React.useEffect(() => {
    if (user) {
      const intendedRole = localStorage.getItem('intended_role');
      if (intendedRole && (!user.full_name || !user.phone_number)) {
        if (!location.pathname.includes('roleselection')) {
          navigate(createPageUrl("RoleSelection"), { replace: true });
        }
        return;
      }
      if (!user.full_name || !user.username) {
        if (!location.pathname.includes('editprofile') && !location.pathname.includes('roleselection')) {
          navigate(createPageUrl("EditProfile"), { replace: true });
        }
      }
    }
  }, [user, navigate, location.pathname]);

  const { logout } = useAuth();

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/');
  }, [logout, navigate]);

  const handleLogin = useCallback(() => {
    navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
  }, [navigate]);

  const closeMenu = useCallback(() => setMobileMenuOpen(false), []);

  const handleNavigateCreateTrip = useCallback(() => {
    navigate(createPageUrl("TripForm"));
  }, [navigate]);

  const handleNavigateEditProfile = useCallback(() => {
    navigate(createPageUrl("EditProfile"));
  }, [navigate]);

  const publicNav = useMemo(() => [
    { title: t('navigation.calendar'),   url: createPageUrl("Calendar"),       icon: Calendar },
    { title: t('navigation.organizers'), url: createPageUrl("OrganizersList"), icon: Users },
    { title: t('navigation.guides'),     url: createPageUrl("Guides"),         icon: Compass },
    { title: t('navigation.refuges'),    url: createPageUrl("GreekRefuges"),   icon: Home },
  ], [t]);

  const roleBasedNav = useMemo(() => {
    if (!user) return [];
    const urls = isOrganizer ? ORGANIZER_NAV_URLS : CLIENT_NAV_URLS;
    return urls.map(({ key, url, icon }) => ({ title: t(key), url, icon }));
  }, [user, isOrganizer, t]);

  const pathname = location.pathname;

  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      {/* Skip-to-content for keyboard/screen-reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-brand-dark focus:text-brand-gold focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Skip to content
      </a>

      {/* Desktop header — visible only md+ */}
      <DesktopHeader />

      <main id="main-content" className="flex-1 flex flex-col">
        {/* Mobile-only top bar */}
        <header
          className="bg-brand-dark px-4 md:hidden sticky top-0 z-40"
          style={{
            paddingTop: 'max(env(safe-area-inset-top), 0.75rem)',
            paddingBottom: '0.75rem',
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {showBackButton && !isTabRoot() ? (
                <button
                  onClick={goBackInTab}
                  className="flex items-center gap-1 text-brand-gold pl-1 pr-2 py-2 rounded-lg transition-colors min-h-[44px] text-sm font-medium max-w-[140px]"
                  aria-label={`Go back to ${backLabel}`}
                >
                  <ArrowLeft className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  <span className="truncate">{backLabel}</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="text-brand-gold hover:bg-brand-gold/10 p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex-shrink-0"
                    aria-label="Open menu"
                  >
                    <Menu className="w-5 h-5" aria-hidden="true" />
                  </button>
                  <img
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68edfeced35e3590d79eccb8/01040e5a0_logo.png"
                    alt="Nature Explorers"
                    className="h-8 w-auto"
                  />
                </>
              )}
            </div>

            <div className="flex items-center gap-1">
              {user && (
                <div className="text-brand-gold">
                  <NotificationsBell user={user} compact={true} />
                </div>
              )}
              {isOrganizer && pathname.includes('/mytrips') && user && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNavigateCreateTrip}
                    className="min-h-[44px] min-w-[44px] text-brand-gold hover:bg-brand-gold/10"
                    aria-label={t('create_trip.title')}
                  >
                    <PlusCircle className="w-5 h-5" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNavigateEditProfile}
                    className="min-h-[44px] min-w-[44px] hover:bg-brand-gold/10"
                    aria-label="Edit profile"
                  >
                    {user.profile_picture_url ? (
                      <img src={user.profile_picture_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-brand-gold" aria-hidden="true" />
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Mobile drawer — custom Sheet, no shadcn Sidebar dependency */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-[280px] bg-brand-dark border-r border-brand-gold/10 p-0 flex flex-col [&>button:first-child]:hidden">
            <VisuallyHidden>
              <SheetTitle>Navigation Menu</SheetTitle>
              <SheetDescription>Main navigation links</SheetDescription>
            </VisuallyHidden>

            {/* Sheet header */}
            <div className="flex items-center justify-between p-5 border-b border-brand-gold/10">
              <Link to={createPageUrl("Home")} className="flex items-center gap-3" onClick={closeMenu}>
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68edfeced35e3590d79eccb8/01040e5a0_logo.png"
                  alt="Nature Explorers"
                  className="h-8 w-auto"
                />
                <span className="font-bold text-brand-gold text-base" style={{ fontFamily: 'var(--font-heading)' }}>
                  Nature Explorers
                </span>
              </Link>
              <button
                onClick={closeMenu}
                className="text-brand-gold/70 hover:text-brand-gold min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Navigation links */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              <p className="text-xs font-semibold text-brand-gold/40 uppercase tracking-wider px-3 py-2">
                {user ? (isOrganizer ? t('layout.hello_organizer') : t('layout.hello_hiker')) : t('common.explore')}
              </p>
              {publicNav.map((item) => {
                const Icon = item.icon;
                const active = pathname.startsWith(item.url.split('?')[0]);
                return (
                  <Link
                    key={item.title}
                    to={item.url}
                    onClick={closeMenu}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg min-h-[44px] transition-colors ${
                      active ? 'bg-brand-gold/10 text-brand-gold' : 'text-brand-gold/75 hover:bg-brand-gold/5 hover:text-brand-gold'
                    }`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                    <span className="text-sm font-medium">{item.title}</span>
                  </Link>
                );
              })}

              {user && roleBasedNav.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-brand-gold/40 uppercase tracking-wider px-3 py-2 mt-4">
                    {isOrganizer ? t('layout.organizer_tools') : t('layout.my_activities')}
                  </p>
                  {roleBasedNav.map((item) => {
                    const Icon = item.icon;
                    const active = pathname.startsWith(item.url.split('?')[0]);
                    return (
                      <Link
                        key={item.title}
                        to={item.url}
                        onClick={closeMenu}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg min-h-[44px] transition-colors ${
                          active ? 'bg-brand-gold/10 text-brand-gold' : 'text-brand-gold/75 hover:bg-brand-gold/5 hover:text-brand-gold'
                        }`}
                        aria-current={active ? 'page' : undefined}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                        <span className="text-sm font-medium">{item.title}</span>
                      </Link>
                    );
                  })}
                </>
              )}

              {/* Language switcher */}
              <div className="pt-4 border-t border-brand-gold/10 mt-4">
                <p className="text-xs font-semibold text-brand-gold/40 uppercase tracking-wider px-3 py-2">
                  {language === 'el' ? 'Γλώσσα' : 'Language'}
                </p>
                <div className="flex gap-2 px-3 py-2">
                  <Button
                    size="sm"
                    onClick={() => setLanguage('en')}
                    className={`flex-1 min-h-[44px] border border-brand-gold/30 ${language === 'en' ? 'bg-brand-gold/15 text-brand-gold' : 'bg-transparent text-brand-gold/60 hover:bg-brand-gold/10'}`}
                    aria-pressed={language === 'en'}
                    variant="ghost"
                  >
                    EN
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setLanguage('el')}
                    className={`flex-1 min-h-[44px] border border-brand-gold/30 ${language === 'el' ? 'bg-brand-gold/15 text-brand-gold' : 'bg-transparent text-brand-gold/60 hover:bg-brand-gold/10'}`}
                    aria-pressed={language === 'el'}
                    variant="ghost"
                  >
                    ΕΛ
                  </Button>
                </div>
              </div>
            </div>

            {/* Sheet footer — user or login */}
            <div className="border-t border-brand-gold/10 p-4">
              {user ? (
                <div className="space-y-3">
                  <Link to={createPageUrl("EditProfile")} onClick={closeMenu} className="flex items-center gap-3 p-2 rounded-lg hover:bg-brand-gold/5 min-h-[44px]">
                    <div className="w-9 h-9 bg-brand-gold/10 rounded-full flex items-center justify-center flex-shrink-0">
                      {user.profile_picture_url
                        ? <img src={user.profile_picture_url} alt="" className="w-full h-full object-cover rounded-full" />
                        : <User className="w-4 h-4 text-brand-gold" aria-hidden="true" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-brand-gold text-sm truncate">{user.full_name}</p>
                      <p className="text-xs text-brand-gold/50 truncate">{isOrganizer ? t('roles.organizer') : t('roles.hiker')}</p>
                    </div>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-brand-gold/60 hover:text-brand-gold hover:bg-brand-gold/5 rounded-lg transition-colors min-h-[44px]"
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                    {t('common.logout')}
                  </button>
                </div>
              ) : (
                <Button
                  onClick={() => { handleLogin(); closeMenu(); }}
                  className="w-full bg-brand-gold-accent hover:bg-brand-gold-accent/90 text-brand-dark font-bold min-h-[44px]"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  <LogIn className="w-4 h-4 mr-2" aria-hidden="true" />
                  {t('common.login')}
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Page content — pb-20 ensures content isn't hidden behind the fixed BottomNav */}
        <div className="flex-1 relative overflow-hidden pb-20 md:pb-0">
          {children}
        </div>
      </main>
    </div>
  );
});

// ─── AppLayout — no longer needs SidebarProvider ─────────────────────────────
const AppLayout = ({ children, isOrganizer, user, location }) => (
  <AppLayoutInner user={user} isOrganizer={isOrganizer} location={location}>
    {children}
  </AppLayoutInner>
);

// ─── PublicLayout — used for Home / RoleSelection ─────────────────────────────
const PublicLayout = ({ children }) => (
  <div className="flex flex-col min-h-screen pb-20 md:pb-0">
    <PublicHeader />
    <main className="flex-1">{children}</main>
    <PublicFooter />
  </div>
);

// ─── Layout — top-level export ────────────────────────────────────────────────
export default function Layout({ children, currentPageName, user: propUser, isOrganizer: propIsOrganizer, location: propLocation }) {
  const routerLocation = useLocation();
  const location = propLocation || routerLocation;

  const { user: authUser } = useAuth();
  const user = propUser || authUser;
  const isOrganizer = propIsOrganizer ?? !!(user?.organizer_code && user.organizer_code.trim().length > 0);

  const publicOnlyPages = ['Home', 'RoleSelection'];

  if (publicOnlyPages.includes(currentPageName)) {
    return (
      <>
        <PublicLayout>{children}</PublicLayout>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <AppLayout user={user} isOrganizer={isOrganizer} location={location}>
        {children}
      </AppLayout>
      <BottomNav />
    </>
  );
}
