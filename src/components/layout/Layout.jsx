import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Calendar, Mountain, PlusCircle, Bookmark, Map, User, LogOut, Edit, BarChart3 } from "lucide-react";
import { base44 } from "@/api/base44Client";
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
} from "@/components/ui/sidebar";
import PublicHeader from "../layout/PublicHeader";
import PublicFooter from "../layout/PublicFooter";
import NotificationsBell from "../layout/NotificationsBell";

const AppLayout = ({ children, isOrganizer, user, location }) => {
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      const intendedRole = localStorage.getItem('intended_role');
      
      if (intendedRole && (!user.full_name || !user.phone_number)) {
        if (!location.pathname.includes('RoleSelection')) {
          navigate(createPageUrl("RoleSelection"));
        }
        return;
      }
      
      if (!user.full_name || !user.phone_number) {
        if (!location.pathname.includes('EditProfile') && !location.pathname.includes('RoleSelection')) {
          navigate(createPageUrl("EditProfile"));
        }
      }
    }
  }, [user, navigate, location.pathname]);

  const handleLogout = () => {
    base44.auth.logout(createPageUrl("Home"));
  };

  const clientNav = [
    { title: "Calendar", url: createPageUrl("Calendar"), icon: Calendar },
    { title: "My Bookings", url: createPageUrl("MyBookings"), icon: Bookmark },
    { title: "My Stats", url: createPageUrl("MyProfile"), icon: BarChart3 },
    { title: "Edit Profile", url: createPageUrl("EditProfile"), icon: Edit },
  ];

  const organizerNav = [
    { title: "Calendar", url: createPageUrl("Calendar"), icon: Calendar },
    { title: "Create Trip", url: createPageUrl("CreateTrip"), icon: PlusCircle },
    { title: "My Trips", url: createPageUrl("MyTrips"), icon: Map },
    { title: "Analytics", url: createPageUrl("MyProfile"), icon: BarChart3 },
    { title: "Edit Profile", url: createPageUrl("EditProfile"), icon: Edit },
  ];

  const navigationItems = isOrganizer ? organizerNav : clientNav;

  return (
     <SidebarProvider>
      <div className="min-h-screen flex w-full bg-stone-50">
        <Sidebar className="border-r border-stone-200">
          <SidebarHeader className="border-b border-stone-200 p-6">
            <Link to={createPageUrl("Home")} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68edfeced35e3590d79eccb8/01040e5a0_logo.png" alt="Nature Explorers" className="w-full h-full object-contain" />
              </div>
              <div>
                <h2 className="font-bold text-stone-900">Nature Explorers</h2>
                <p className="text-xs text-stone-500">natureexplorers.gr</p>
              </div>
            </Link>
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-stone-500 uppercase tracking-wider px-3 py-2">
                {isOrganizer ? "Organizer Tools" : "Explore"}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-emerald-50 hover:text-emerald-700 transition-all duration-200 rounded-lg mb-1 ${
                          location.pathname.startsWith(item.url.split('?')[0]) ? 'bg-emerald-50 text-emerald-700 font-medium' : ''
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                          <item.icon className="w-4 h-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-stone-200 p-4">
            {user && (
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
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-white border-b border-stone-200 px-6 py-4 md:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-stone-100 p-2 rounded-lg transition-colors" />
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68edfeced35e3590d79eccb8/01040e5a0_logo.png" alt="Nature Explorers" className="h-8 w-auto" />
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
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

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        localStorage.removeItem('intended_role');
      }
    };
    fetchUser();
  }, []);

  const isOrganizer = user?.role === "admin";
  const publicPages = ['Home', 'OrganizersList', 'Calendar', 'TripDetails', 'OrganizerProfile', 'RoleSelection'];

  if (currentPageName === 'Home') {
    return <PublicLayout>{children}</PublicLayout>;
  }

  if (publicPages.includes(currentPageName) && !user) {
    return <PublicLayout>{children}</PublicLayout>;
  }
  
  if (currentPageName === 'RoleSelection') {
    return <PublicLayout>{children}</PublicLayout>;
  }

  return (
    <AppLayout user={user} isOrganizer={isOrganizer} location={location}>
      {children}
    </AppLayout>
  );
}