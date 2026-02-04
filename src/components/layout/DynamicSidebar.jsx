import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Building2, Calendar, User, Mountain } from "lucide-react";

export default function DynamicSidebar({ user }) {
  const { data: guideProfile } = useQuery({
    queryKey: ['guide-profile', user?.id],
    queryFn: () => base44.entities.MountainGuide.filter({ user_id: user.id }).then(res => res[0]),
    enabled: !!user?.id,
  });

  const { data: organizer } = useQuery({
    queryKey: ['organizer', user?.organizer_code],
    queryFn: () => base44.entities.Organizer.filter({ organizer_code: user.organizer_code }).then(res => res[0]),
    enabled: !!user?.organizer_code,
  });

  if (!user?.organizer_code) {
    return null;
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <Mountain className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Organizer Panel</span>
            <span className="text-xs text-muted-foreground truncate">
              {organizer?.full_name || user.full_name}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="View your organizer page">
                  <Link to={createPageUrl(`OrganizerProfile?organizerCode=${user.organizer_code}`)}>
                    <Building2 className="h-4 w-4" />
                    <span>My Organizer Page</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Manage your trips">
                  <Link to={createPageUrl("MyTrips")}>
                    <Calendar className="h-4 w-4" />
                    <span>My Trips</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {guideProfile && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Guide Profile
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="View your guide profile">
                    <Link to={createPageUrl(`GuideProfile?id=${guideProfile.id}`)}>
                      <User className="h-4 w-4" />
                      <span>My Guide Profile</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="px-2 py-3 text-xs text-muted-foreground">
          Code: <span className="font-mono font-semibold">{user.organizer_code}</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}