import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, Check, Circle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsBell({ user, compact = false }) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch unread count (ds_notifications_unread_count) - poll every 30s
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-unread-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const notifications = await base44.entities.Notification.filter({ 
        user_id: user.id, 
        is_read: false 
      });
      console.log('[NotificationsBell] Unread count:', notifications.length);
      return notifications.length;
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Poll every 30 seconds
    refetchOnWindowFocus: true,
  });

  // Fetch notifications list (ds_notifications_list) - poll every 60s
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications-list', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const result = await base44.entities.Notification.filter(
        { user_id: user.id },
        "-created_date",
        30
      );
      console.log('[NotificationsBell] Fetched notifications:', result.length);
      return result;
    },
    enabled: !!user?.id && isOpen,
    refetchInterval: 60000, // Poll every 60 seconds
    refetchOnWindowFocus: true,
  });

  // Mark single notification as read (ds_mark_notification_read)
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      console.log('[NotificationsBell] Marking notification as read:', notificationId);
      return await base44.entities.Notification.update(notificationId, { is_read: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
    },
  });

  // Mark all notifications as read (ds_mark_all_notifications_read)
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      console.log('[NotificationsBell] Marking all notifications as read');
      const unreadNotifications = notifications.filter(n => !n.is_read);
      await Promise.all(
        unreadNotifications.map(n => 
          base44.entities.Notification.update(n.id, { is_read: true })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
    },
  });

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const displayCount = unreadCount > 99 ? '99+' : unreadCount;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={`relative ${compact ? 'rounded-lg min-h-[44px] min-w-[44px]' : 'rounded-full'}`}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-medium text-white">
              {displayCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 md:w-96" align="end">
        <div className="flex justify-between items-center px-2 py-1.5">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button 
              variant="link" 
              size="sm" 
              className="h-auto p-0 text-xs" 
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
            >
              {markAllAsReadMutation.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : (
                <Check className="w-3 h-3 mr-1" />
              )}
              Mark all as read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />

        {isLoading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
          </div>
        ) : notifications.length > 0 ? (
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem 
                key={notification.id} 
                asChild 
                className="cursor-pointer focus:bg-stone-100"
              >
                <div
                  className="flex items-start gap-3 p-3 border-b border-stone-100 last:border-0"
                  onClick={() => handleNotificationClick(notification)}
                >
                  {!notification.is_read && (
                    <Circle className="h-2 w-2 mt-2 text-blue-500 fill-current flex-shrink-0" />
                  )}
                  {notification.is_read && (
                    <div className="h-2 w-2 mt-2 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    {notification.title && (
                      <p className={`text-sm mb-0.5 ${!notification.is_read ? 'font-semibold text-stone-900' : 'font-medium text-stone-700'}`}>
                        {notification.title}
                      </p>
                    )}
                    <p className="text-sm text-stone-600 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-stone-500 mt-1">
                      {formatDistanceToNow(new Date(notification.created_date), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 mx-auto text-stone-300 mb-2" />
            <p className="text-sm text-stone-500">No notifications yet</p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}