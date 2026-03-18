import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, User, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/components/contexts/LanguageContext';
import { toast } from 'sonner';
import useSEO from '../components/seo/useSEO';

export default function MyFollowingPage() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();

  useSEO({
    title: language === 'el'
      ? 'Οι Διοργανωτές που Ακολουθώ | Nature Explorers'
      : 'My Following | Nature Explorers',
    description: language === 'el'
      ? 'Διαχειριστείτε τους διοργανωτές πεζοπορίας που ακολουθείτε και λαμβάνετε ειδοποιήσεις για νέες εκδρομές.'
      : 'Manage the hiking organizers you follow and receive notifications about new trips.',
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch (error) {
        return null;
      }
    },
    retry: false,
  });

  const { data: follows = [], isLoading: followsLoading } = useQuery({
    queryKey: ['my-follows', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.OrganizerFollow.filter({ user_id: user.id });
    },
    enabled: !!user,
  });

  const { data: organizers = [], isLoading: organizersLoading } = useQuery({
    queryKey: ['followed-organizers', follows],
    queryFn: async () => {
      if (follows.length === 0) return [];
      const organizerCodes = follows.map(f => f.organizer_code);
      const allOrganizers = await base44.entities.Organizer.list();
      return allOrganizers.filter(org => organizerCodes.includes(org.organizer_code));
    },
    enabled: follows.length > 0,
  });

  const unfollowMutation = useMutation({
    mutationFn: async (followId) => {
      await base44.entities.OrganizerFollow.delete(followId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-follows']);
      queryClient.invalidateQueries(['organizer-follow']);
      toast.success(language === 'el' 
        ? 'Σταματήσατε να ακολουθείτε τον διοργανωτή' 
        : 'Unfollowed organizer'
      );
    },
    onError: () => {
      toast.error(language === 'el' 
        ? 'Αποτυχία διακοπής ακολούθησης' 
        : 'Failed to unfollow'
      );
    }
  });

  const isLoading = followsLoading || organizersLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-stone-400 mb-4" />
            <h2 className="text-xl font-bold text-stone-900 mb-2">
              {language === 'el' ? 'Απαιτείται Σύνδεση' : 'Login Required'}
            </h2>
            <p className="text-stone-600">
              {language === 'el' 
                ? 'Συνδεθείτε για να δείτε τους διοργανωτές που ακολουθείτε.' 
                : 'Please log in to view the organizers you follow.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-stone-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mb-2">
            {language === 'el' ? 'Οι Διοργανωτές που Ακολουθώ' : 'My Following'}
          </h1>
          <p className="text-stone-600">
            {language === 'el' 
              ? 'Λαμβάνετε ειδοποιήσεις όταν αυτοί οι διοργανωτές δημοσιεύουν νέες εκδρομές.' 
              : 'You receive notifications when these organizers publish new trips.'}
          </p>
        </div>

        {follows.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Heart className="w-16 h-16 mx-auto text-stone-300 mb-4" />
              <h3 className="text-lg font-semibold text-stone-700 mb-2">
                {language === 'el' ? 'Δεν ακολουθείτε κανέναν ακόμα' : 'Not following anyone yet'}
              </h3>
              <p className="text-stone-500 mb-6">
                {language === 'el' 
                  ? 'Ανακαλύψτε διοργανωτές και ακολουθήστε τους για να λαμβάνετε ειδοποιήσεις για νέες εκδρομές.' 
                  : 'Discover organizers and follow them to get notified about new trips.'}
              </p>
              <Link to={createPageUrl('OrganizersList')}>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  {language === 'el' ? 'Εξερευνήστε Διοργανωτές' : 'Explore Organizers'}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizers.map((organizer) => {
              const followRecord = follows.find(f => f.organizer_code === organizer.organizer_code);
              return (
                <Card key={organizer.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-full bg-stone-200 flex-shrink-0 overflow-hidden">
                        {organizer.profile_picture_url ? (
                          <img 
                            src={organizer.profile_picture_url} 
                            alt={organizer.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-8 h-8 text-stone-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg truncate">{organizer.full_name}</CardTitle>
                          {organizer.is_verified && (
                            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          )}
                        </div>
                        {organizer.years_of_experience && (
                          <p className="text-sm text-stone-600">
                            {organizer.years_of_experience} {language === 'el' ? 'χρόνια εμπειρίας' : 'years experience'}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {organizer.bio && (
                      <p className="text-sm text-stone-600 mb-4 line-clamp-2">{organizer.bio}</p>
                    )}
                    <div className="flex gap-2">
                      <Link to={`${createPageUrl('OrganizerProfile')}/${organizer.username}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          {language === 'el' ? 'Προβολή Προφίλ' : 'View Profile'}
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => followRecord && unfollowMutation.mutate(followRecord.id)}
                        disabled={unfollowMutation.isPending}
                        className="text-stone-500 hover:text-red-600"
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}