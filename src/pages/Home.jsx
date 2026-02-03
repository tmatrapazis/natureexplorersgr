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
import OptimizedImage from '../components/ui/OptimizedImage';

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

  // 301 Redirect: /Home and /home to root /
  React.useEffect(() => {
    const path = window.location.pathname;
    if (path === '/Home' || path === '/home') {
      window.location.replace('/');
    }
  }, []);

  // Enhanced SEO Configuration with target keywords
  useSEO({
    title: language === 'el' 
      ? 'Πεζοπορία Ελλάδα | Οργανωμένες Εκδρομές | Ομαδικές Εκδρομές | Nature Explorers'
      : 'Hiking Greece | Trekking Greece | Organized Hiking Trips | Nature Explorers',
    description: language === 'el'
      ? 'Οι καλύτερες οργανωμένες εκδρομές και ομαδικές εκδρομές πεζοπορίας στην Ελλάδα. Ταξίδια πεζοπορίας, trekking, ορειβασία σε Πάρνηθα, Όλυμπο, Πήλιο με έμπειρους οδηγούς. Βρείτε ομάδες πεζοπορίας και κρατήστε θέση σε εκδρομές βουνού. Nature Explorers - Η #1 πλατφόρμα outdoor περιπετειών.'
      : 'Best organized hiking trips and group expeditions in Greece. Hiking tours, trekking adventures, mountain climbing in Parnitha, Olympus, Pelion with expert guides. Find hiking groups and book hiking trips. Nature Explorers - #1 outdoor adventure platform.',
    image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68edfeced35e3590d79eccb8/01040e5a0_logo.png',
    url: window.location.href,
    type: 'website'
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const { data: featuredExpeditions = [] } = useQuery({
    queryKey: ['featured-expeditions'],
    queryFn: async () => {
      const trips = await base44.entities.HikingTrip.list('-start_date', 100);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const futureTrips = trips.filter(trip => {
        if (!trip.start_date) return false;
        const startDate = new Date(trip.start_date);
        startDate.setHours(0, 0, 0, 0);
        return startDate > today && (trip.status === 'upcoming' || trip.status === 'almost soldout');
      });
      
      const shuffled = [...futureTrips].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 3);
    },
    initialData: [],
  });

  const { data: featuredTrips } = useQuery({
    queryKey: ['featured-trips'],
    queryFn: async () => {
      // Fetch all trips sorted by start date
      const trips = await base44.entities.HikingTrip.list('start_date', 50);
      
      // Filter to show trips starting from today + 3 days and after
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const threeDaysFromNow = new Date(today);
      threeDaysFromNow.setDate(today.getDate() + 3);
      
      const upcomingTrips = trips.filter(trip => {
        if (!trip.start_date) return false;
        const startDate = new Date(trip.start_date);
        startDate.setHours(0, 0, 0, 0);
        return startDate >= threeDaysFromNow;
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

  // Enhanced Structured Data for Organization with target keywords
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "TouristInformationCenter",
    "name": "Nature Explorers",
    "alternateName": language === 'el' ? "Nature Explorers - Πεζοπορία Ελλάδα" : "Nature Explorers Greece - Hiking & Trekking",
    "url": window.location.origin,
    "logo": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68edfeced35e3590d79eccb8/01040e5a0_logo.png",
    "image": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68edfeced35e3590d79eccb8/01040e5a0_logo.png",
    "description": language === 'el' 
      ? "Η #1 πλατφόρμα για οργανωμένες εκδρομές και ομαδικές εκδρομές πεζοπορίας στην Ελλάδα. Βρείτε ταξίδια πεζοπορίας, trekking Greece, ορειβασία και outdoor δραστηριότητες με πιστοποιημένους οδηγούς. Ημερολόγιο εκδρομών βουνό σε Όλυμπο, Πάρνηθα, Πήλιο και όλη την Ελλάδα."
      : "The #1 platform for organized hiking trips and group expeditions in Greece. Find hiking tours, trekking adventures Greece, mountain climbing and outdoor activities with certified guides. Hiking calendar for Olympus, Parnitha, Pelion and all Greece.",
    "sameAs": [
      "https://www.facebook.com/natureexplorersgr/",
      "https://www.instagram.com/natureexplorers.gr/"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "natureexplorersgr@gmail.com",
      "contactType": "Customer Service",
      "areaServed": "GR",
      "availableLanguage": ["en", "el"]
    },
    "areaServed": {
      "@type": "Country",
      "name": "Greece"
    },
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "GR"
    },
    "makesOffer": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": language === 'el' ? "Οργανωμένες Εκδρομές Πεζοπορίας" : "Organized Hiking Trips",
          "description": language === 'el' 
            ? "Ομαδικές εκδρομές πεζοπορίας με έμπειρους οδηγούς σε όλη την Ελλάδα"
            : "Group hiking expeditions with experienced guides across Greece"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": language === 'el' ? "Trekking & Ορειβασία" : "Trekking & Mountain Climbing",
          "description": language === 'el'
            ? "Trekking adventures και ορειβατικές αποστολές στα ελληνικά βουνά"
            : "Trekking adventures and mountain expeditions in Greek mountains"
        }
      }
    ],
    "keywords": language === 'el'
      ? "ταξίδια, πεζοπορία, πεζοπορία στην ελλάδα, trekking greece, hiking greece, εκδρομές, ομαδικές εκδρομές, οργανωμένες εκδρομές, ομάδες πεζοπορίας, εκδρομές βουνό, ορειβασία, outdoor activities, πεζοπορικές διαδρομές, μονοπάτια, hiking trips, weekend εκδρομές, φύση, περιπέτεια"
      : "travel, hiking, hiking in greece, trekking greece, hiking greece, trips, group trips, organized trips, hiking groups, mountain trips, climbing, outdoor activities, hiking trails, paths, hiking adventures, weekend trips, nature, adventure"
  };

  // Enhanced Structured Data for WebSite with FAQs
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Nature Explorers",
    "alternateName": language === 'el' ? "Nature Explorers - Πεζοπορία Ελλάδα | Οργανωμένες Εκδρομές" : "Nature Explorers - Hiking Greece | Organized Trips",
    "url": window.location.origin,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${window.location.origin}${createPageUrl("Calendar")}?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    },
    "inLanguage": ["en", "el"],
    "description": language === 'el'
      ? "Βρείτε οργανωμένες εκδρομές πεζοπορίας, ομαδικές εκδρομές και ταξίδια στην Ελλάδα. Trekking Greece, hiking adventures με έμπειρους οδηγούς."
      : "Find organized hiking trips, group expeditions and travel adventures in Greece. Trekking Greece, hiking tours with expert guides.",
    "about": {
      "@type": "Thing",
      "name": language === 'el' ? "Πεζοπορία και Ορειβασία Ελλάδα" : "Hiking and Trekking Greece"
    },
    "keywords": language === 'el'
      ? "ταξίδια, πεζοπορία, πεζοπορία στην ελλάδα, trekking greece, hiking greece, εκδρομές, ομαδικές εκδρομές, οργανωμένες εκδρομές, πού να πάω για πεζοπορία, καλύτερες εκδρομές βουνό, ομάδες πεζοπορίας αθήνα, weekend εκδρομές, μονοήμερες εκδρομές, πολυήμερες εκδρομές, ορειβασία ελλάδα"
      : "travel, hiking, hiking in greece, trekking greece, hiking greece, trips, group trips, organized trips, where to hike in greece, best mountain trips, hiking groups athens, weekend trips, day trips, multi-day trips, climbing greece"
  };
  
  // FAQ Schema for SEO
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": language === 'el' ? [
      {
        "@type": "Question",
        "name": "Πού μπορώ να βρω οργανωμένες εκδρομές πεζοπορίας στην Ελλάδα;",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Στο Nature Explorers θα βρείτε τις καλύτερες οργανωμένες εκδρομές και ομαδικές εκδρομές πεζοπορίας σε όλη την Ελλάδα με πιστοποιημένους οδηγούς. Εξερευνήστε το ημερολόγιο εκδρομών μας για trekking, ορειβασία και outdoor δραστηριότητες."
        }
      },
      {
        "@type": "Question",
        "name": "Πώς μπορώ να συμμετέχω σε ομαδικές εκδρομές πεζοπορίας;",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Εγγραφείτε στο Nature Explorers, περιηγηθείτε στις διαθέσιμες εκδρομές στο ημερολόγιο, επιλέξτε την εκδρομή που σας ενδιαφέρει και κάντε κράτηση. Όλες οι εκδρομές είναι οργανωμένες με έμπειρους συνοδούς βουνού."
        }
      },
      {
        "@type": "Question",
        "name": "Τι είδους εκδρομές προσφέρει το Nature Explorers;",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Προσφέρουμε ποικιλία εκδρομών: μονοήμερες και πολυήμερες εκδρομές πεζοπορίας, trekking adventures, ορειβασία, weekend trips και outdoor δραστηριότητες σε Όλυμπο, Πάρνηθα, Πήλιο και όλη την Ελλάδα."
        }
      }
    ] : [
      {
        "@type": "Question",
        "name": "Where can I find organized hiking trips in Greece?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "At Nature Explorers you'll find the best organized hiking trips and group expeditions across Greece with certified guides. Explore our hiking calendar for trekking, mountain climbing and outdoor activities."
        }
      },
      {
        "@type": "Question",
        "name": "How can I join group hiking expeditions?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sign up at Nature Explorers, browse available trips in our calendar, select the expedition that interests you and make a booking. All trips are organized with experienced mountain guides."
        }
      },
      {
        "@type": "Question",
        "name": "What types of trips does Nature Explorers offer?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We offer a variety of trips: day trips and multi-day hiking expeditions, trekking adventures, mountain climbing, weekend trips and outdoor activities in Olympus, Parnitha, Pelion and all over Greece."
        }
      }
    ]
  };

  return (
    <>
      <StructuredData data={organizationSchema} />
      <StructuredData data={websiteSchema} />
      <StructuredData data={faqSchema} />
      
      <div className="flex flex-col min-h-screen">
        <main className="flex-1">
          {/* Preload hint for hero image - Critical for LCP */}
          <link 
            rel="preload" 
            as="image" 
            href="https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800&q=80&fm=webp"
            imagesrcset="https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=600&q=80&fm=webp 600w, https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=1200&q=80&fm=webp 1200w"
            imagesizes="100vw"
          />
          
          <section className="relative h-[60vh] md:h-[80vh] flex items-center justify-center text-center text-white">
            <div className="absolute inset-0 bg-black/50 z-10" />
            <img 
              src="https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=1200&q=80&fm=webp"
              srcSet="https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=600&q=80&fm=webp 600w,
                      https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=1200&q=80&fm=webp 1200w,
                      https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=1920&q=80&fm=webp 1920w"
              sizes="100vw"
              alt={language === 'el' 
                ? "Πεζοπορία στα ελληνικά βουνά - ομάδες πεζοπορίας σε ορειβατική διαδρομή με πανοραμική θέα - outdoor adventures Greece"
                : "Hiking in Greek mountains - hiking teams Greece on mountain trekking trail with panoramic views - outdoor activities"}
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
              fetchpriority="high"
              decoding="sync"
              width="1920"
              height="1280"
            />
            <div className="relative z-20 container px-4 max-w-2xl mx-auto">
              <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight drop-shadow-lg leading-tight">
                {language === 'el' ? 'Οργανωμένες Εκδρομές Πεζοπορίας στην Ελλάδα' : 'Organized Hiking Trips in Greece'}
              </h1>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg lg:text-xl text-stone-200 drop-shadow-md leading-relaxed">
                {language === 'el' 
                  ? 'Ομαδικές εκδρομές, trekking και ταξίδια ορειβασίας με έμπειρους οδηγούς - Βρείτε την επόμενη περιπέτειά σας!'
                  : 'Group expeditions, trekking and mountain adventures with expert guides - Find your next adventure!'}
              </p>
              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
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
              <p className="mt-5 sm:mt-6 text-xs sm:text-sm text-stone-300 max-w-md mx-auto leading-relaxed">
                {language === 'el'
                  ? 'Εγγραφείτε δωρεάν και ξεκινήστε την επόμενη outdoor περιπέτειά σας σήμερα!'
                  : 'Sign up free and start your next outdoor adventure today!'}
              </p>
            </div>
          </section>

          {featuredExpeditions.length > 0 && (
            <section className="py-16 px-4 bg-white">
              <div className="container mx-auto max-w-6xl">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-stone-900">
                  {language === 'el' ? 'Επιλεγμένες Εκδρομές' : 'Featured Expeditions'}
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {featuredExpeditions.map(trip => {
                    const organizer = organizerMap[trip.organizer_code];
                    return (
                      <Card key={trip.id} className="overflow-hidden hover:shadow-xl transition-shadow flex flex-col">
                        <div className="h-48 bg-stone-200 overflow-hidden relative" style={{ aspectRatio: '16/9' }}>
                          <OptimizedImage
                            src={getTripImage(trip.image_url, trip.id)}
                            alt={trip.title}
                            width={800}
                            height={450}
                            className="w-full h-full"
                            objectFit="cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            onError={(e) => handleImageError(e, trip.id)}
                          />
                        </div>
                        <CardContent className="p-6 flex flex-col flex-grow">
                          <h3 className="text-xl font-bold text-stone-900 mb-2">{trip.title}</h3>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <Badge className={difficultyColors[trip.difficulty]}>
                              {trip.difficulty}
                            </Badge>
                            <Badge variant="outline">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDateRange(trip.start_date, trip.end_date)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-stone-600 mb-2">
                            <MapPin className="w-4 h-4 text-emerald-600" />
                            <span>{trip.location}</span>
                          </div>
                          {organizer && (
                            <div className="flex items-center gap-2 text-sm text-stone-500 mb-4">
                              <UserIcon className="w-4 h-4" />
                              <span>{organizer.username || organizer.full_name}</span>
                            </div>
                          )}
                          <Link to={`${createPageUrl("TripDetails")}?id=${trip.id}`} className="mt-auto">
                            <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                              {language === 'el' ? 'Δείτε Λεπτομέρειες' : 'View Details'}
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </>
  );
}