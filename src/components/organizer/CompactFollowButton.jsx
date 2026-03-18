import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/components/contexts/LanguageContext';

export default function CompactFollowButton({ organizer, user }) {
  const queryClient = useQueryClient();
  const { language } = useLanguage();

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
      variant="outline"
      size="icon"
      onClick={handleClick}
      disabled={isPending}
      className={`flex-shrink-0 ${isFollowing ? 'bg-red-50 border-red-300 hover:bg-red-100' : 'hover:bg-stone-50'}`}
    >
      <Heart className={`w-5 h-5 ${isFollowing ? 'fill-red-500 text-red-500' : 'text-stone-400'}`} />
    </Button>
  );
}