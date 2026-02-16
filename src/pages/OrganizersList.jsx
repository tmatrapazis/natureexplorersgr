import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Loader2, Calendar, Mail, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import VerifiedBadge from '../components/shared/VerifiedBadge';
import PageWrapper from '../components/layout/PageWrapper';
import { useLanguage } from '../components/contexts/LanguageContext';
import { useTranslation } from '../components/translations/useTranslations';
import useSEO from '../components/seo/useSEO';

export default function OrganizersListPage() {
  const { language } = useLanguage();
  const { t } = useTranslation(language);

  // SEO Configuration with keywords
  useSEO({
    title: language === 'el'
      ? 'Οδηγοί Πεζοπορίας Ελλάδα | Ομάδες Πεζοπορίας | Διοργανωτές Εκδρομών Ορειβασία | Nature Explorers'
      : 'Hiking Teams Greece | Hiking Guides & Trip Organizers | Trekking Groups | Nature Explorers',
    description: language === 'el'
      ? 'Ανακαλύψτε έμπειρους και πιστοποιημένους οδηγούς πεζοπορίας σε όλη την Ελλάδα. Ομάδες πεζοπορίας, οργανωμένες εκδρομές βουνό, hiking teams Greece. Περιηγηθείτε σε προφίλ και βρείτε τον ιδανικό οδηγό για την επόμενη ορειβατική σας περιπέτεια.'
      : 'Discover experienced and verified hiking guides across Greece. Browse hiking teams Greece, trekking organizers, outdoor activity leaders. Find the perfect guide for your next mountain adventure, hiking trips and weekend expeditions.',
    image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68edfeced35e3590d79eccb4/01040e5a0_logo.png',
    url: window.location.href,
    type: 'website'
  });

  const { data: organizers = [], isLoading: organizersLoading } = useQuery({
    queryKey: ['organizers-list'],
    queryFn: () => base44.entities.Organizer.list(),
    initialData: [],
  });

  const { data: allTrips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ['all-upcoming-trips'],
    queryFn: () => base44.entities.HikingTrip.list(),
    initialData: [],
  });

  // Create a map of organizer_code -> trip count (only upcoming or almost soldout trips with start_date > today)
  const tripCountMap = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const map = {};
    allTrips.forEach(trip => {
      const isUpcoming = (trip.status === 'upcoming' || trip.status === 'almost soldout');
      const isFuture = trip.start_date && new Date(trip.start_date) > today;
      
      if (trip.organizer_code && isUpcoming && isFuture) {
        map[trip.organizer_code] = (map[trip.organizer_code] || 0) + 1;
      }
    });
    return map;
  }, [allTrips]);

  // Sort organizers by number of upcoming trips (descending)
  const sortedOrganizers = React.useMemo(() => {
    return [...organizers].sort((a, b) => {
      const countA = tripCountMap[a.organizer_code] || 0;
      const countB = tripCountMap[b.organizer_code] || 0;
      return countB - countA; // Descending order (most trips first)
    });
  }, [organizers, tripCountMap]);

  const isLoading = organizersLoading || tripsLoading;

  return (
    <PageWrapper>
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3">
            {language === 'el' ? 'Γνωρίστε τους Οδηγούς Πεζοπορίας' : t('organizer.meet_organizers')}
          </h1>
          <p className="text-stone-600 max-w-2xl mx-auto">
            {t('organizer.new_organizer_cta')}
            {' '}
            <a
              href="mailto:natureexplorersgr@gmail.com"
              className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
            >
              <Mail className="w-4 h-4" aria-hidden="true" />
              Email
            </a>
            {' '}
            <span className="text-stone-400">or</span>
            {' '}
            <a
              href="https://www.instagram.com/natureexplorers.gr/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
            >
              <Instagram className="w-4 h-4" aria-hidden="true" />
              Instagram
            </a>
          </p>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
          </div>
        ) : sortedOrganizers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-stone-600 mb-4">{t('organizer.no_organizers')}</p>
            <Link to={createPageUrl("Calendar")}>
              <Button>{t('booking.browse_trips')}</Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {sortedOrganizers.map(organizer => {
              const tripCount = tripCountMap[organizer.organizer_code] || 0;

              return (
                <Card key={organizer.id} className="text-center shadow-lg hover:shadow-xl transition-shadow flex flex-col h-full">
                  <CardHeader className="p-0">
                    <div className="mx-auto w-24 h-24 mt-6 border-4 border-white rounded-full overflow-hidden bg-stone-200 flex items-center justify-center">
                      {organizer.profile_picture_url ? (
                        <img
                          src={organizer.profile_picture_url}
                          alt={language === 'el'
                            ? `${organizer.username || organizer.full_name} - οδηγός πεζοπορίας Ελλάδα`
                            : `${organizer.username || organizer.full_name} - hiking trekking guide Greece`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-12 h-12 text-stone-400" aria-hidden="true" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 flex flex-col flex-grow">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <h2 className="text-xl font-bold">{organizer.username || organizer.full_name}</h2>
                      {organizer.is_verified && <VerifiedBadge showText={false} />}
                    </div>
                    {organizer.years_of_experience && (
                      <p className="text-sm text-stone-500 mb-2">
                        {organizer.years_of_experience} {t('organizer.years_experience')}
                      </p>
                    )}

                    <div className="flex items-center justify-center gap-2 mb-3">
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        <Calendar className="w-3 h-3 mr-1" aria-hidden="true" />
                        {tripCount} {tripCount === 1 ? t('organizer.upcoming_trip') : t('organizer.upcoming_trips_plural')}
                      </Badge>
                    </div>

                    <p className="text-muted-foreground mt-2 min-h-[60px] mb-4">
                      {organizer.bio ? `${organizer.bio.substring(0, 100)}...` : t('organizer.passionate_guide')}
                    </p>
                    <Link to={`${createPageUrl("OrganizerProfile")}?code=${organizer.organizer_code}`} className="mt-auto">
                      <Button className="bg-emerald-600 hover:bg-emerald-700 w-full">{t('organizer.view_profile_trips')}</Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
    </PageWrapper>
  );
}