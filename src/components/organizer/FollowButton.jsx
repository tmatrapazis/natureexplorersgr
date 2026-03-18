import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Heart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/components/contexts/LanguageContext';

export default function FollowButton({ organizer, user }) {
  const queryClient = useQueryClient();
  const { language } = useLanguage();

  // Check if user is already following this organizer
  const { data: followRecord, isLoading: followLoading } = useQuery({
    queryKey: ['organizer-follow', user?.id, organizer.organizer_code],
    queryFn: async () => {
      if (!user) return null;
      const follows = await base44.entities.OrganizerFollow.filter({
        user_id: user.id,
        organizer_code: organizer.organizer_code
      });
      return follows.length > 0 ? follows[0] : null;
    },
    enabled: !!user,
  });

  // Derive follow state directly from server data — no local state needed.
  // While a mutation is in flight we apply an optimistic value so the button
  // feels instant; once the refetch completes the server value takes over.
  const followMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.OrganizerFollow.create({
        user_id: user.id,
        user_email: user.email,
        user_name: user.full_name || user.username,
        organizer_code: organizer.organizer_code,
        organizer_name: organizer.full_name
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizer-follow', user?.id, organizer.organizer_code] });
      queryClient.invalidateQueries({ queryKey: ['organizer-follower-count', organizer.organizer_code] });
      queryClient.invalidateQueries({ queryKey: ['my-follows'] });
      toast.success(language === 'el'
        ? `Ακολουθείτε τον ${organizer.full_name}`
        : `Following ${organizer.full_name}`
      );
    },
    onError: () => {
      toast.error(language === 'el'
        ? 'Αποτυχία ακολούθησης'
        : 'Failed to follow'
      );
    }
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      if (!followRecord?.id) throw new Error('Follow record not found');
      await base44.entities.OrganizerFollow.delete(followRecord.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizer-follow', user?.id, organizer.organizer_code] });
      queryClient.invalidateQueries({ queryKey: ['organizer-follower-count', organizer.organizer_code] });
      queryClient.invalidateQueries({ queryKey: ['my-follows'] });
      toast.success(language === 'el'
        ? `Δεν ακολουθείτε πλέον τον ${organizer.full_name}`
        : `Unfollowed ${organizer.full_name}`
      );
    },
    onError: () => {
      toast.error(language === 'el'
        ? 'Αποτυχία διακοπής ακολούθησης'
        : 'Failed to unfollow'
      );
    }
  });

  // Optimistic: treat the button as already toggled while the request is in-flight
  const isFollowing = followMutation.isPending
    ? true
    : unfollowMutation.isPending
    ? false
    : !!followRecord;

  const isPending = followLoading || followMutation.isPending || unfollowMutation.isPending;

  const handleClick = () => {
    if (!user) {
      toast.error(language === 'el'
        ? 'Συνδεθείτε για να ακολουθήσετε διοργανωτές'
        : 'Please log in to follow organizers'
      );
      return;
    }

    if (isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  return (
    <Button
      variant={isFollowing ? "default" : "outline"}
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className="gap-2"
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Heart className={`w-4 h-4 ${isFollowing ? 'fill-current' : ''}`} />
      )}
      {isFollowing
        ? (language === 'el' ? 'Ακολουθείτε' : 'Following')
        : (language === 'el' ? 'Ακολούθηση' : 'Follow')
      }
    </Button>
  );
}