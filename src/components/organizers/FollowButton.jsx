import React from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/contexts/LanguageContext';
import { createOptimisticCreate, createOptimisticDelete } from '@/lib/optimistic-mutations';

export default function FollowButton({
  organizer,
  variant = 'default',
  showCount = false,
  size = 'default',
  className
}) {
  const queryClient = useQueryClient();
  const { language } = useLanguage();

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  // Check if user is following this organizer
  const { data: followRecord, isLoading } = useQuery({
    queryKey: ['organizer-follow', organizer.organizer_code, currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return null;
      const follows = await base44.entities.OrganizerFollow.filter({
        user_id: currentUser.id,
        organizer_code: organizer.organizer_code
      });
      return follows.length > 0 ? follows[0] : null;
    },
    enabled: !!currentUser && !!organizer.organizer_code,
  });

  // Get follower count (only fetched when showCount=true)
  const { data: followerCount = 0 } = useQuery({
    queryKey: ['organizer-followers-count', organizer.organizer_code],
    queryFn: async () => {
      const follows = await base44.entities.OrganizerFollow.filter({
        organizer_code: organizer.organizer_code
      });
      return follows.length;
    },
    enabled: !!organizer.organizer_code && showCount,
  });

  const followQueryKey = ['organizer-follow', organizer.organizer_code, currentUser?.id];

  // Follow mutation with optimistic updates
  const followMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.OrganizerFollow.create({
        user_id: currentUser.id,
        user_email: currentUser.email,
        user_name: currentUser.full_name || currentUser.username || '',
        organizer_code: organizer.organizer_code,
        organizer_username: organizer.username || organizer.organizer_code,
        organizer_name: organizer.full_name || organizer.username || '',
      });
    },
    ...createOptimisticCreate(
      queryClient,
      followQueryKey,
      (data) => ({
        id: 'temp-' + Date.now(),
        ...data,
        created_date: new Date().toISOString(),
      })
    ),
    onSuccess: (newRecord) => {
      queryClient.setQueryData(followQueryKey, newRecord);
      queryClient.invalidateQueries({ queryKey: ['organizer-followers-count'] });
      queryClient.invalidateQueries({ queryKey: ['my-follows'] });
      toast.success(language === 'el'
        ? `Ακολουθείτε τον ${organizer.full_name}!`
        : `You're now following ${organizer.full_name}!`
      );
    },
    onError: () => {
      toast.error(language === 'el' ? 'Αποτυχία ακολούθησης' : 'Failed to follow organizer');
    }
  });

  // Unfollow mutation with optimistic updates
  const unfollowMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.OrganizerFollow.deleteMany({
        user_id: currentUser.id,
        organizer_code: organizer.organizer_code
      });
    },
    ...createOptimisticDelete(
      queryClient,
      followQueryKey,
      () => false // Always filter out (delete)
    ),
    onSuccess: () => {
      queryClient.setQueryData(followQueryKey, null);
      queryClient.invalidateQueries({ queryKey: ['organizer-followers-count'] });
      queryClient.invalidateQueries({ queryKey: ['my-follows'] });
      toast.success(language === 'el'
        ? `Δεν ακολουθείτε πλέον τον ${organizer.full_name}`
        : `You unfollowed ${organizer.full_name}`
      );
    },
    onError: () => {
      toast.error(language === 'el' ? 'Αποτυχία διακοπής ακολούθησης' : 'Failed to unfollow organizer');
    }
  });

  // Derive follow state optimistically so the button toggles immediately on click,
  // without waiting for the server round-trip and query refetch.
  // No useState/useEffect needed — this is always in sync with reality.
  const isFollowing = followMutation.isPending ? true
    : unfollowMutation.isPending ? false
    : !!followRecord;

  const isPending = followMutation.isPending || unfollowMutation.isPending;

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      toast.error(language === 'el'
        ? 'Συνδεθείτε για να ακολουθήσετε διοργανωτές'
        : 'Please log in to follow organizers'
      );
      return;
    }

    // Use derived isFollowing (not raw followRecord) so the click
    // always reflects the current optimistic state
    if (isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  // ── Icon-only variant (used on organizer list cards) ──────────────────────
  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        disabled={isPending || isLoading}
        className={cn(
          "p-2 rounded-full transition-all min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation",
          isFollowing
            ? "text-red-500 hover:bg-red-50 active:bg-red-100"
            : "text-muted-foreground hover:text-red-500 hover:bg-accent active:bg-accent",
          isPending && "opacity-50 cursor-wait",
          className
        )}
        aria-label={isFollowing
          ? (language === 'el' ? 'Διακοπή ακολούθησης' : 'Unfollow')
          : (language === 'el' ? 'Ακολούθηση' : 'Follow')
        }
      >
        {isPending ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Heart className={cn("w-5 h-5 transition-all", isFollowing && "fill-current")} />
        )}
      </button>
    );
  }

  // ── Default text button variant (used on organizer profile page) ──────────
  return (
    <Button
      variant={isFollowing ? "outline" : variant}
      size={size}
      onClick={handleClick}
      disabled={isPending || isLoading}
      className={cn(
        "gap-2 min-h-[44px] touch-manipulation",
        isFollowing && "border-red-200 hover:bg-red-50 active:bg-red-100",
        className
      )}
      aria-label={`${isFollowing ? (language === 'el' ? 'Ακολουθείτε' : 'Following') : (language === 'el' ? 'Ακολούθηση' : 'Follow')} ${showCount && followerCount > 0 ? `(${followerCount} followers)` : ''}`}
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
      ) : (
        <Heart className={cn("w-4 h-4", isFollowing && "fill-red-500 text-red-500")} aria-hidden="true" />
      )}
      {isFollowing
        ? (language === 'el' ? 'Ακολουθείτε' : 'Following')
        : (language === 'el' ? 'Ακολούθηση' : 'Follow')
      }
      {showCount && followerCount > 0 && (
        <span className="text-xs text-muted-foreground">({followerCount})</span>
      )}
    </Button>
  );
}