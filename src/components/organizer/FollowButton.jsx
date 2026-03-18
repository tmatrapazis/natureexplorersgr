import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/components/contexts/LanguageContext';

export default function FollowButton({ organizer, user }) {
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const [isFollowing, setIsFollowing] = useState(false);

  // Check if user is already following this organizer
  const { data: followRecord } = useQuery({
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

  React.useEffect(() => {
    setIsFollowing(!!followRecord);
  }, [followRecord]);

  const followMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.OrganizerFollow.create({
        user_id: user.id,
        user_email: user.email,
        user_name: user.full_name || user.username,
        organizer_code: organizer.organizer_code,
        organizer_name: organizer.full_name
      });
    },
    onSuccess: () => {
      setIsFollowing(true);
      queryClient.invalidateQueries(['organizer-follow']);
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
      if (followRecord) {
        await base44.entities.OrganizerFollow.delete(followRecord.id);
      }
    },
    onSuccess: () => {
      setIsFollowing(false);
      queryClient.invalidateQueries(['organizer-follow']);
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
      disabled={followMutation.isPending || unfollowMutation.isPending}
      className="gap-2"
    >
      <Heart className={`w-4 h-4 ${isFollowing ? 'fill-current' : ''}`} />
      {isFollowing 
        ? (language === 'el' ? 'Ακολουθείτε' : 'Following')
        : (language === 'el' ? 'Ακολούθηση' : 'Follow')
      }
    </Button>
  );
}