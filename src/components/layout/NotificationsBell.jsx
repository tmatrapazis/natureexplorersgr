import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createOptimisticUpdate } from '@/lib/optimistic-mutations';
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
import { el, enUS } from 'date-fns/locale';
import { useLanguage } from '@/components/contexts/LanguageContext';
import { useTranslation } from '@/components/translations/useTranslations';

function NotificationsBell({ user, compact = false }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const dateLocale = language === 'el' ? el : enUS;

  const { data: notifications = [], isLoading, refetch } = useQuery({
    queryKey: ['notifications-list', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const result = await base44.entities.Notification.filter({ user_id: user.id });
      result.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      return result;
    },
    enabled: !!user?.id,
    refetchOnWindowFocus: true,
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      await base44.entities.Notification.update(notificationId, { is_read: true });
    },
    ...createOptimisticUpdate(
      queryClient,
      ['notifications-list', user?.id],
      (notification, notificationId) =>
        notification.id === notificationId ? { ...notification, is_read: true } : notification
    ),
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      if (unread.length === 0) return;
      await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    },
    ...createOptimisticUpdate(
      queryClient,
      ['notifications-list', user?.id],
      (notification) => ({ ...notification, is_read: true })
    ),
  });

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
    if (notification.link) {
      setIsOpen(false);
      if (notification.link.startsWith('http://') || notification.link.startsWith('https://')) {
        window.location.href = notification.link;
      } else {
        navigate(notification.link);
      }
    }
  };

  const displayCount = unreadCount > 99 ? '99+' : unreadCount;

  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (open) refetch();
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`relative ${compact ? 'rounded-lg min-h-[44px] min-w-[44px]' : 'rounded-full min-h-[44px] min-w-[44px]'}`}
          aria-label={`Notifications${unreadCount > 0 ? ` (${displayCount} unread)` : ''}`}
        >
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
          <DropdownMenuLabel>{t('notifications.title')}</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs min-h-[24px]"
              onClick={(e) => {
                e.stopPropagation();
                markAllAsReadMutation.mutate();
              }}
              disabled={markAllAsReadMutation.isPending}
            >
              {markAllAsReadMutation.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : (
                <Check className="w-3 h-3 mr-1" />
              )}
              {t('notifications.mark_all_read')}
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />

        {isLoading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length > 0 ? (
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-3 p-3 border-b border-border last:border-0 hover:bg-accent cursor-pointer transition-colors min-h-[60px] ${!notification.is_read ? 'bg-primary/5' : ''}`}
                onClick={() => handleNotificationClick(notification)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), handleNotificationClick(notification))}
              >
                {!notification.is_read ? (
                  <Circle className="h-2 w-2 mt-2 text-emerald-500 fill-current flex-shrink-0" />
                ) : (
                  <div className="h-2 w-2 mt-2 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  {notification.title && (
                    <p className={`text-sm mb-0.5 ${!notification.is_read ? 'font-semibold text-foreground' : 'font-medium text-foreground'}`}>
                      {notification.title}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notification.created_date), { addSuffix: true, locale: dateLocale })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">{t('notifications.no_notifications')}</p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
export default React.memo(NotificationsBell);
