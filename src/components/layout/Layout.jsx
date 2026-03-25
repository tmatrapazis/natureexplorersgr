import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Calendar, PlusCircle, Map, User, LogOut, Edit, Users, Compass, Home, LogIn, X, ArrowLeft } from "lucide-react";
import { useTabNavigation } from "@/lib/TabNavigationContext";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "../contexts/LanguageContext";
import { useTranslation } from "../translations/useTranslations";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import PublicHeader from "../layout/PublicHeader";
import PublicFooter from "../layout/PublicFooter";
import NotificationsBell from "../layout/NotificationsBell";

const AppLayoutInner = ({ children, isOrganizer, user, location }) => {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation(language);
  const { setOpenMobile } = useSidebar();
  const { canGoBack, goBackInTab, isTabRoot, navigateToTab } = useTabNavigation();

  React.useEffect(() => {
    if (user) {
      const intendedRole = localStorage.getItem('intended_role');
      
      if (intendedRole && (!user.full_name || !user.phone_number)) {
        if (!location.pathname.includes('RoleSelection')) {
          navigate(createPageUrl("RoleSelection"), { replace: true });
        }
        return;
      }
      
      if (!user.full_name || !user.username) {
        if (!location.pathname.includes('EditProfile') && !location.pathname.includes('RoleSelection')) {
          navigate(createPageUrl("EditProfile"), { replace: true });
        }
      }
    }
  }, [user, navigate, location.pathname]);

  const handleLogout = () => {
    base44.auth.logout(createPageUrl("Home"));
  };

  const handleLogin = () => {
    base44.auth.redirectToLogin(window.location.pathname);
  };

  // Public navigation - always shown
  const publicNav = [
    { title: t('navigation.calendar'), url: createPageUrl("Calendar"), icon: Calendar },
    { title: t('navigation.organizers'), url: createPageUrl("OrganizersList"), icon: Users },
    { title: t('navigation.guides'), url: createPageUrl("Guides"), icon: Compass },
    { title: t('navigation.refuges'), url: createPageUrl("GreekRefuges"), icon: Home },
  ];

  const clientNav = [
    { title: "Edit Profile", url: createPageUrl("EditProfile"), icon: Edit },
  ];

  const organizerNav = [
    { title: "Create Trip", url: createPageUrl("CreateTrip"), icon: PlusCircle },
    { title: "My Trips", url: createPageUrl("MyTrips"), icon: Map },
    { title: "Edit Profile", url: createPageUrl("EditProfile"), icon: Edit },
  ];

  const roleBasedNav = user ? (isOrganizer ? organizerNav : clientNav) : [];

  const handleNavClick = () => {
    // Close mobile sidebar when nav item is clicked
    setOpenMobile(false);
  };

  return (
      <div className="min-h-screen flex w-full bg-stone-50">
        <Sidebar className="border-r border-stone-200">
         <SidebarHeader className="border-b border-stone-200 p-6">
           <div className="flex items-center justify-between">
             <Link to={createPageUrl("Home")} className="flex items-center gap-3" onClick={handleNavClick}>
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68edfeced35e3590d79eccb8/01040e5a0_logo.png" alt="Nature Explorers" className="w-full h-full object-contain" />
              </div>
              <div>
                <h2 className="font-bold text-stone-900">Nature Explorers</h2>
                <p className="text-xs text-stone-500">Discover the wild side of Greece</p>
              </div>
              </Link>
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden"
                aria-label="Close menu"
                onClick={() => setOpenMobile(false)}
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </Button>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3 scrollbar-hide">
            {/* Public Navigation */}
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-stone-500 uppercase tracking-wider px-3 py-2">
                {user ? (isOrganizer ? "Hello Organizer" : "Hello Hiker") : t('common.explore')}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {publicNav.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-emerald-50 hover:text-emerald-700 transition-all duration-200 rounded-lg mb-1 ${
                          location.pathname.startsWith(item.url.split('?')[0]) ? 'bg-emerald-50 text-emerald-700 font-medium' : ''
                        }`}
                      >
                        <Link 
                          to={item.url} 
                          className="flex items-center gap-3 px-3 py-2.5 min-h-[44px]" 
                          onClick={handleNavClick}
                          aria-label={`Navigate to ${item.title}`}
                          aria-current={location.pathname.startsWith(item.url.split('?')[0]) ? 'page' : undefined}
                        >
                          <item.icon className="w-4 h-4" aria-hidden="true" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Role-based Navigation */}
            {user && roleBasedNav.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-semibold text-stone-500 uppercase tracking-wider px-3 py-2">
                  {isOrganizer ? "Organizer Tools" : "My Activities"}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {roleBasedNav.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          className={`hover:bg-emerald-50 hover:text-emerald-700 transition-all duration-200 rounded-lg mb-1 ${
                            location.pathname.startsWith(item.url.split('?')[0]) ? 'bg-emerald-50 text-emerald-700 font-medium' : ''
                          }`}
                        >
                          <Link 
                            to={item.url} 
                            className="flex items-center gap-3 px-3 py-2.5 min-h-[44px]" 
                            onClick={handleNavClick}
                            aria-label={`Navigate to ${item.title}`}
                            aria-current={location.pathname.startsWith(item.url.split('?')[0]) ? 'page' : undefined}
                          >
                            <item.icon className="w-4 h-4" aria-hidden="true" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* Language Switcher */}
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-stone-500 uppercase tracking-wider px-3 py-2">
                {language === 'el' ? 'Γλώσσα' : 'Language'}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="px-3 py-2 flex gap-2">
                  <Button 
                    variant={language === 'en' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setLanguage('en')}
                    className="flex-1 min-h-[44px]"
                    aria-label="Switch to English"
                    aria-pressed={language === 'en'}
                  >
                    EN
                  </Button>
                  <Button 
                    variant={language === 'el' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setLanguage('el')}
                    className="flex-1 min-h-[44px]"
                    aria-label="Αλλαγή σε Ελληνικά"
                    aria-pressed={language === 'el'}
                  >
                    ΕΛ
                  </Button>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-stone-200 p-4">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2">
                  <Link to={createPageUrl("EditProfile")} className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow">
                      {user.profile_picture_url ? <img src={user.profile_picture_url} alt=" " className="w-full h-full object-cover rounded-full" /> : <User className="w-5 h-5 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-900 text-sm truncate">{user.full_name}</p>
                      <p className="text-xs text-stone-500 truncate">{isOrganizer ? "Organizer" : "Hiker"}</p>
                    </div>
                  </Link>
                  <NotificationsBell user={user} />
                </div>
                <button
                  onClick={handleLogout}
                  aria-label={t('common.logout')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors min-h-[44px]"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                  {t('common.logout')}
                </button>
              </div>
            ) : (
              <Button 
                onClick={handleLogin}
                className="w-full bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
                aria-label={t('common.login')}
              >
                <LogIn className="w-4 h-4 mr-2" aria-hidden="true" />
                {t('common.login')}
              </Button>
            )}
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header 
            className="bg-white border-b border-stone-200 px-4 md:hidden sticky top-0 z-40"
            style={{ 
              paddingTop: 'max(env(safe-area-inset-top), 1rem)',
              paddingBottom: '1rem'
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {canGoBack() && !isTabRoot() ? (
                  <button
                    onClick={goBackInTab}
                    className="hover:bg-stone-100 p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px]"
                    aria-label="Go back"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                ) : (
                  <SidebarTrigger 
                    className="hover:bg-stone-100 p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px]"
                    aria-label="Open menu"
                  />
                )}
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68edfeced35e3590d79eccb8/01040e5a0_logo.png" alt="Nature Explorers" className="h-8 w-auto" />
              </div>
              
              {user && <NotificationsBell user={user} compact={true} />}
              
              {/* Organizer actions on MyTrips page */}
              {isOrganizer && location.pathname.includes('/MyTrips') && user && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(createPageUrl("CreateTrip"))}
                    className="min-h-[44px] min-w-[44px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                    aria-label={t('create_trip.title')}
                  >
                    <PlusCircle className="w-5 h-5" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(createPageUrl("EditProfile"))}
                    className="min-h-[44px] min-w-[44px] hover:bg-stone-100"
                    aria-label="Edit profile"
                  >
                    {user.profile_picture_url ? (
                      <img src={user.profile_picture_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          </header>

          <div className="flex-1 overflow-auto scrollbar-hide pb-0 md:pb-0" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 4rem)' }}>
            {children}
          </div>

          {/* Mobile Bottom Navigation */}
          <nav
            aria-label="Main navigation"
            className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 z-50 select-none shadow-lg"
            style={{
              paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)',
              paddingTop: '0.5rem'
            }}
          >
            <div className="flex items-center justify-around px-2">
              {publicNav.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.url.split('?')[0]);
                
                return (
                  <button
                    key={item.title}
                    onClick={() => navigateToTab(item.url)}
                    className={`flex flex-col items-center justify-center py-1 px-3 min-h-[48px] min-w-[48px] transition-colors rounded-lg ${
                      isActive 
                        ? "text-emerald-600 bg-emerald-50" 
                        : "text-stone-500 hover:text-stone-700 hover:bg-stone-50"
                    }`}
                    aria-label={`Navigate to ${item.title}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-medium">{item.title}</span>
                  </button>
                );
              })}
              
              {user && (
                <Link
                  to={createPageUrl("EditProfile")}
                  className={`flex flex-col items-center justify-center py-1 px-3 min-h-[48px] min-w-[48px] transition-colors rounded-lg ${
                    location.pathname.includes('/EditProfile')
                      ? "text-emerald-600 bg-emerald-50" 
                      : "text-stone-500 hover:text-stone-700 hover:bg-stone-50"
                  }`}
                  aria-label="View and edit profile"
                  aria-current={location.pathname.includes('/EditProfile') ? 'page' : undefined}
                >
                  {user.profile_picture_url ? (
                    <img src={user.profile_picture_url} alt="" className="w-6 h-6 rounded-full object-cover mb-1" />
                  ) : (
                    <User className="w-5 h-5 mb-1" />
                  )}
                  <span className="text-[10px] font-medium">Profile</span>
                </Link>
              )}
            </div>
          </nav>
        </main>
      </div>
  );
};

const AppLayout = ({ children, isOrganizer, user, location }) => {
  return (
    <SidebarProvider>
      <AppLayoutInner user={user} isOrganizer={isOrganizer} location={location}>
        {children}
      </AppLayoutInner>
    </SidebarProvider>
  );
};

const PublicLayout = ({ children }) => (
  <div className="flex flex-col min-h-screen">
    <PublicHeader />
    <main className="flex-1">{children}</main>
    <PublicFooter />
  </div>
);

export default function Layout({ children, currentPageName, user: propUser, isOrganizer: propIsOrganizer, location: propLocation }) {
  const routerLocation = useLocation();
  const location = propLocation || routerLocation;

  const { data: queryUser } = useQuery({
    queryKey: ['current-user-layout'],
    queryFn: () => base44.auth.me(),
    retry: false,
    staleTime: 5 * 60 * 1000,
    enabled: !propUser, // Only fetch if user not provided via props
  });

  const user = propUser || queryUser;
  const isOrganizer = propIsOrganizer ?? (user?.organizer_code && user.organizer_code.trim().length > 0);
  const publicOnlyPages = ['Home', 'RoleSelection'];
  const publicPages = ['OrganizersList', 'Calendar', 'TripDetails', 'OrganizerProfile'];

  if (publicOnlyPages.includes(currentPageName)) {
    return <PublicLayout>{children}</PublicLayout>;
  }

  // For public pages: always use AppLayout (avoids layout switching on user load which breaks history)
  // For private pages: also use AppLayout
  return (
    <AppLayout user={user} isOrganizer={isOrganizer} location={location}>
      {children}
    </AppLayout>
  );
}