import React, { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Organizer, HikingTrip } from '@/api/db';

import PullToRefresh from '../components/ui/PullToRefresh';
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
import StructuredData from '../components/seo/StructuredData';
import FollowButton from '../components/organizers/FollowButton';

export default function OrganizersListPage() {
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const { t } = useTranslation(language);

  // SEO Configuration with keywords
  useSEO({
    title: language === 'el'
      ? 'Ομάδες Πεζοπορίας Ελλάδα | Οδηγοί & Διοργανωτές Εκδρομών | Nature Explorers'
      : 'Hiking Groups Greece | Hiking Guides & Trip Organizers | Nature Explorers',
    description: language === 'el'
      ? 'Ανακαλύψτε 14+ ομάδες πεζοπορίας και πιστοποιημένους οδηγούς σε όλη την Ελλάδα. Εκδρομές βουνό, trekking & outdoor περιπέτειες. Βρείτε τη σωστή ομάδα για εσάς!'
      : 'Discover 14+ hiking groups and certified guides across Greece. Browse trekking organizers, outdoor leaders and find your perfect hiking team for mountain adventures.',
    image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68edfeced35e3590d79eccb4/01040e5a0_logo.png',
    url: 'https://natureexplorers.gr/organizerslist',
    type: 'website'
  });

  const { data: organizers = [], isLoading: organizersLoading } = useQuery({
    queryKey: ['organizers-list'],
    queryFn: () => Organizer.list(),
    initialData: [],
  });

  const { data: allTrips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ['all-upcoming-trips'],
    queryFn: () => HikingTrip.list(),
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

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['organizers-list'] }),
      queryClient.invalidateQueries({ queryKey: ['all-upcoming-trips'] }),
    ]);
  }, [queryClient]);

  // Breadcrumb structured data
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Nature Explorers", "item": "https://natureexplorers.gr/" },
      { "@type": "ListItem", "position": 2, "name": language === 'el' ? "Ομάδες Πεζοπορίας" : "Hiking Groups", "item": "https://natureexplorers.gr/organizerslist" }
    ]
  };

  // ItemList Structured Data for directory page
  const itemListSchema = sortedOrganizers.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": language === 'el' ? "Οδηγοί Πεζοπορίας Ελλάδα" : "Hiking Guides & Trip Organizers Greece",
    "url": "https://natureexplorers.gr/organizerslist",
    "numberOfItems": sortedOrganizers.length,
    "itemListElement": sortedOrganizers.map((organizer, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": `https://natureexplorers.gr/organizerprofile/${organizer.username}`,
      "name": organizer.full_name
    }))
  } : null;

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <PageWrapper>
        <StructuredData data={breadcrumbSchema} />
        {itemListSchema && <StructuredData data={itemListSchema} />}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3">
            {language === 'el' ? 'Γνωρίστε τους Οδηγούς Πεζοπορίας' : t('organizer.meet_organizers')}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
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
            <span className="text-muted-foreground">or</span>
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
            <p className="text-muted-foreground mb-4">{t('organizer.no_organizers')}</p>
            <Link to={createPageUrl("Calendar")} aria-label={t('booking.browse_trips')}>
              <Button className="min-h-[44px]" tabIndex={-1}>{t('booking.browse_trips')}</Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {sortedOrganizers.map(organizer => {
              const tripCount = tripCountMap[organizer.organizer_code] || 0;

              return (
                /* content-visibility skips layout/paint for off-screen cards */
                <div key={organizer.id} style={{ contentVisibility: 'auto', containIntrinsicSize: '0 380px' }}>
                <Card className="text-center shadow-lg hover:shadow-xl transition-shadow flex flex-col h-full">
                  <CardHeader className="p-0 relative">
                    <div className="absolute top-4 right-4 z-10">
                      <FollowButton organizer={organizer} variant="icon" />
                    </div>
                    <div className="mx-auto w-24 h-24 mt-6 border-4 border-white rounded-full overflow-hidden bg-muted flex items-center justify-center">
                      {organizer.profile_picture_url ? (
                        <img
                          src={organizer.profile_picture_url}
                          alt={language === 'el'
                            ? `${organizer.username || organizer.full_name} - οδηγός πεζοπορίας Ελλάδα`
                            : `${organizer.username || organizer.full_name} - hiking trekking guide Greece`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-12 h-12 text-muted-foreground" aria-hidden="true" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 flex flex-col flex-grow">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <h2 className="text-xl font-bold">{organizer.full_name}</h2>
                      {organizer.is_verified && <VerifiedBadge showText={false} />}
                    </div>
                    {organizer.years_of_experience && (
                      <p className="text-sm text-muted-foreground mb-2">
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
                    <Link
                      to={`${createPageUrl("OrganizerProfile")}/${organizer.username}`}
                      className="mt-auto"
                      aria-label={`${t('organizer.view_profile_trips')}: ${organizer.full_name}`}
                    >
                      <Button className="bg-emerald-600 hover:bg-emerald-700 w-full min-h-[44px]" tabIndex={-1}>{t('organizer.view_profile_trips')}</Button>
                    </Link>
                  </CardContent>
                </Card>
                </div>
              );
            })}
          </div>
        )}
    </PageWrapper>
    </PullToRefresh>
  );
}