import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MapPin, Calendar, TrendingUp, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { formatDateRange } from '../components/helpers/dateHelpers';
import { useLanguage } from '../components/contexts/LanguageContext';
import { useTranslation } from '../components/translations/useTranslations';
import useSEO from '../components/seo/useSEO';
import StructuredData from '../components/seo/StructuredData';
import { getComputedTripStatus } from '../components/helpers/tripHelpers';
import { getTripImage, handleImageError } from '../components/helpers/imageHelpers';

const difficultyColors = {
  easy: "bg-green-100 text-green-800",
  moderate: "bg-yellow-100 text-yellow-800",
  challenging: "bg-orange-100 text-orange-800",
  difficult: "bg-red-100 text-red-800"
};

export default function HomePage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { t } = useTranslation(language);

  // SEO Configuration with provided keywords
  useSEO({
    title: language === 'el' 
      ? 'Nature Explorers | Πεζοπορία Ελλάδα | Ομάδες Πεζοπορίας | Εκδρομές Βουνό | Ορειβασία'
      : 'Nature Explorers | Hiking Greece | Hiking Trips Greece | Outdoor Adventures | Trekking',
    description: language === 'el'
      ? 'Ανακαλύψτε πεζοπορικές εκδρομές και ορειβασία σε όλη την Ελλάδα. Ομάδες πεζοπορίας, οργανωμένες εκδρομές βουνό, μονοπάτια πεζοπορίας, πεζοπορία Πάρνηθα, Όλυμπος, Πήλιο. Δραστηριότητες στη φύση και περιπέτεια στη φύση με Nature Explorers.'
      : 'Discover hiking trips Greece, trekking adventures and outdoor activities. Join hiking teams Greece, explore nature trails, mountain trekking, hiking Parnitha, Olympus, Pelion, Crete. Weekend hiking trips and outdoor adventures with Nature Explorers Greece.',
    image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68edfeced35e3590d79eccb8/01040e5a0_logo.png',
    url: window.location.href,
    type: 'website'
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const { data: featuredTrips } = useQuery({
    queryKey: ['featured-trips'],
    queryFn: async () => {
      // Fetch all trips sorted by start date
      const trips = await base44.entities.HikingTrip.list('start_date', 50);
      
      // Filter to only show truly upcoming trips (start_date >= today)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const upcomingTrips = trips.filter(trip => {
        const startDate = new Date(trip.start_date);
        return startDate >= today;
      });
      
      // Randomly select 3 upcoming trips only
      const shuffled = [...upcomingTrips].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 3);
    },
    initialData: [],
  });

  // Fetch organizers for featured trips
  const { data: organizers = [] } = useQuery({
    queryKey: ['home-organizers'],
    queryFn: () => base44.entities.Organizer.list(),
    initialData: [],
  });

  // Create organizer map
  const organizerMap = React.useMemo(() => {
    const map = {};
    organizers.forEach(org => {
      map[org.organizer_code] = org;
    });
    return map;
  }, [organizers]);

  // Structured Data for Organization with keywords
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Nature Explorers",
    "alternateName": language === 'el' ? "Εξερευνητές Φύσης" : "Nature Explorers Greece",
    "url": "https://natureexplorers.gr",
    "logo": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68edfeced35e3590d79eccb8/01040e5a0_logo.png",
    "description": language === 'el' 
      ? "Η κορυφαία πλατφόρμα για πεζοπορία Ελλάδα, ορειβασία, εκδρομές βουνό και outdoor activities. Ομάδες πεζοπορίας, οργανωμένες εκδρομές, πεζοπορικές διαδρομές σε όλη την Ελλάδα."
      : "The premier platform for hiking Greece, trekking, mountain adventures and outdoor activities. Join hiking teams Greece, explore hiking trails, and discover nature travel experiences.",
    "sameAs": [
      "https://www.facebook.com/natureexplorersgr/",
      "https://www.instagram.com/natureexplorers.gr/"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "natureexplorersgr@gmail.com",
      "contactType": "Customer Service",
      "areaServed": "GR",
      "availableLanguage": ["English", "Greek"]
    },
    "areaServed": {
      "@type": "Country",
      "name": "Greece"
    },
    "keywords": language === 'el'
      ? "πεζοπορία, πεζοπορία ελλάδα, ομάδες πεζοπορίας, εκδρομές βουνό, πεζοπορικές διαδρομές, ημερολόγιο εκδρομών, δραστηριότητες στη φύση, ορειβασία, ορειβασία ελλάδα, φυσικές διαδρομές, μονοπάτια πεζοπορίας, πεζοπορία πάρνηθα, πεζοπορία όλυμπος, οργανωμένες εκδρομές βουνού, περιπέτεια στη φύση"
      : "hiking, hiking greece, hiking trips greece, hiking teams greece, hiking adventures, hiking calendar, outdoor activities greece, trekking, trekking greece, mountain trekking, hiking tours greece, nature travel, hiking parnitha, hiking olympus, hiking pelion, weekend hiking trips greece, hiking community greece, greek hiking groups, nature explorers greece"
  };

  // Structured Data for WebSite
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Nature Explorers",
    "alternateName": language === 'el' ? "Εξερευνητές Φύσης - Πεζοπορία Ελλάδα" : "Nature Explorers - Hiking Greece",
    "url": "https://natureexplorers.gr",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://natureexplorers.gr/calendar?search={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    },
    "inLanguage": ["en", "el"],
    "keywords": language === 'el'
      ? "πού να πάω για πεζοπορία στην ελλάδα, καλύτερα μονοπάτια πεζοπορίας, οργανωμένες εκδρομές βουνού, ομάδες πεζοπορίας, hiking greece"
      : "hiking greece, hiking trips greece, weekend hiking ideas greece, upcoming hiking events in greece, hiking groups near athens, nature trips in greece"
  };

  return (
    <>
      <StructuredData data={organizationSchema} />
      <StructuredData data={websiteSchema} />
      
      <div className="flex flex-col min-h-screen">
        <main className="flex-1">
          <section className="relative h-[60vh] md:h-[80vh] flex items-center justify-center text-center text-white">
            <div className="absolute inset-0 bg-black/50 z-10" />
            <img 
              src="https://images.unsplash.com/photo-1501555088652-021faa106b9b?q=80&w=2073"
              alt={language === 'el' 
                ? "Πεζοπορία στα ελληνικά βουνά - ομάδες πεζοπορίας σε ορειβατική διαδρομή με πανοραμική θέα - outdoor adventures Greece"
                : "Hiking in Greek mountains - hiking teams Greece on mountain trekking trail with panoramic views - outdoor activities"}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="relative z-20 container px-4">
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight drop-shadow-lg">
                {language === 'el' ? 'Ζήσε την Πεζοπορική Περιπέτεια' : t('home.hero_title')}
              </h1>
              <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-stone-200 drop-shadow-md">
                {language === 'el' 
                  ? 'Βρες ομάδες πεζοπορίας και οδηγούς για μοναδικές εκδρομές ορειβασίας και trekking σε όλη την Ελλάδα'
                  : t('home.hero_subtitle')}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link to={createPageUrl("Calendar")}>
                  <Button size="lg" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white">
                    {language === 'el' ? 'Δείτε Πεζοπορικές Εκδρομές' : t('home.browse_expeditions')}
                  </Button>
                </Link>
                <Link to={createPageUrl("OrganizersList")}>
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                    {language === 'el' ? 'Γνωρίστε τους Οδηγούς' : t('home.meet_organizers')}
                  </Button>
                </Link>
              </div>
              <p className="mt-6 text-sm text-stone-300 max-w-md mx-auto">
                {language === 'el'
                  ? 'Εγγραφείτε σήμερα για να ξεκινήσετε το ταξίδι outdoor περιπέτειας'
                  : t('home.join_message')}
              </p>
            </div>
          </section>

          <section className="py-12 md:py-20 bg-stone-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-center mb-10">
                {language === 'el' ? 'Επιλεγμένες Πεζοπορικές Εκδρομές' : t('home.featured_expeditions')}
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {featuredTrips.map(trip => {
                  const organizer = organizerMap[trip.organizer_code];
                  
                  return (
                    <Card key={trip.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                      <Link to={`${createPageUrl("TripDetails")}?id=${trip.id}`}>
                        <img 
                          src={getTripImage(trip.image_url, trip.id)} 
                          alt={language === 'el'
                            ? `${trip.title} - πεζοπορική εκδρομή ${trip.location} Ελλάδα - ορειβασία και trekking adventure`
                            : `${trip.title} - hiking trip ${trip.location} Greece - mountain trekking and outdoor adventure`}
                          className="w-full h-48 object-cover"
                          onError={(e) => handleImageError(e, trip.id)}
                        />
                        <CardContent className="p-4">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge className={difficultyColors[trip.difficulty]}>
                              {t(`trip.difficulty_${trip.difficulty}`)}
                            </Badge>
                            {trip.status === 'upcoming' && (
                              <Badge className="bg-green-100 text-green-800 border-green-200 border text-xs">
                                {language === 'el' ? 'Διαθέσιμο' : 'Available'}
                              </Badge>
                            )}
                            {trip.status === 'almost soldout' && (
                              <Badge className="bg-orange-100 text-orange-800 border-orange-200 border text-xs">
                                {language === 'el' ? 'Σχεδόν γεμάτο' : 'Almost Full'}
                              </Badge>
                            )}
                          </div>
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-bold">{trip.title}</h3>
                            <p className="text-lg font-bold text-emerald-700">€{trip.price}</p>
                          </div>
                          
                          {organizer && (
                            <div className="flex items-center gap-1.5 text-xs text-stone-600 mb-2">
                              <UserIcon className="w-3 h-3" />
                              <span>{language === 'el' ? 'από' : 'by'} {organizer.username || organizer.full_name}</span>
                            </div>
                          )}
                          
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" aria-hidden="true" />
                              <span>{formatDateRange(trip.start_date, trip.end_date)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" aria-hidden="true" />
                              <span>{trip.location}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Link>
                    </Card>
                  );
                })}
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}