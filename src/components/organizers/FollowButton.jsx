import React from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function FollowButton({ 
  organizer, 
  variant = 'default',
  showCount = false,
  size = 'default',
  className 
}) {
  const queryClient = useQueryClient();

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

  // Get follower count
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

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.OrganizerFollow.create({
        user_id: currentUser.id,
        user_email: currentUser.email,
        user_name: currentUser.full_name,
        organizer_code: organizer.organizer_code,
        organizer_username: organizer.username,
        organizer_name: organizer.full_name
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizer-follow'] });
      queryClient.invalidateQueries({ queryKey: ['organizer-followers-count'] });
      toast.success(`You're now following ${organizer.full_name}!`);
    },
    onError: (error) => {
      console.error('Follow error:', error);
      toast.error('Failed to follow organizer');
    }
  });

  // Unfollow mutation
  const unfollowMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.OrganizerFollow.delete(followRecord.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizer-follow'] });
      queryClient.invalidateQueries({ queryKey: ['organizer-followers-count'] });
      toast.success(`You unfollowed ${organizer.full_name}`);
    },
    onError: (error) => {
      console.error('Unfollow error:', error);
      toast.error('Failed to unfollow organizer');
    }
  });

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      toast.error('Please log in to follow organizers');
      return;
    }

    if (followRecord) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  const isFollowing = !!followRecord;
  const isPending = followMutation.isPending || unfollowMutation.isPending;

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        disabled={isPending || isLoading}
        className={cn(
          "p-2 rounded-full transition-all",
          isFollowing 
            ? "text-red-500 hover:bg-red-50" 
            : "text-stone-400 hover:text-red-500 hover:bg-stone-50",
          isPending && "opacity-50 cursor-wait",
          className
        )}
        title={isFollowing ? "Unfollow" : "Follow"}
      >
        <Heart 
          className={cn(
            "w-5 h-5 transition-all",
            isFollowing && "fill-current"
          )}
        />
      </button>
    );
  }

  return (
    <Button
      variant={isFollowing ? "outline" : variant}
      size={size}
      onClick={handleClick}
      disabled={isPending || isLoading}
      className={cn(
        "gap-2",
        isFollowing && "border-red-200 hover:bg-red-50",
        className
      )}
    >
      <Heart 
        className={cn(
          "w-4 h-4",
          isFollowing && "fill-red-500 text-red-500"
        )}
      />
      {isFollowing ? 'Following' : 'Follow'}
      {showCount && followerCount > 0 && (
        <span className="text-xs text-stone-500">({followerCount})</span>
      )}
    </Button>
  );
}