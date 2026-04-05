import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';

import { Calendar, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '../components/contexts/LanguageContext';
import { useTranslation } from '../components/translations/useTranslations';
import useSEO from '../components/seo/useSEO';
import StructuredData from '../components/seo/StructuredData';
import { getComputedTripStatus } from '../components/helpers/tripHelpers';
import { getTripImage, handleImageError } from '../components/helpers/imageHelpers';
import OptimizedImage from '../components/ui/OptimizedImage';
import { formatPriceForCard } from '../components/helpers/pricingHelpers';
import { useAuth } from '@/lib/AuthContext';
import { HikingTrip, Organizer } from '@/api/db';


export default function HomePage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const { user } = useAuth();

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

  const { data: featuredExpeditions = [] } = useQuery({
    queryKey: ['featured-expeditions'],
    queryFn: async () => {
      const trips = await HikingTrip.list('-start_date');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const futureTrips = trips.filter(trip => {
        if (!trip.start_date) return false;
        const startDate = new Date(trip.start_date);
        startDate.setHours(0, 0, 0, 0);
        return startDate > today && (trip.status === 'upcoming' || trip.status === 'almost soldout');
      });

      // Stable shuffle using trip ID as seed to avoid reshuffling on re-renders
      const shuffled = [...futureTrips].sort((a, b) => a.id.localeCompare(b.id));
      return shuffled.slice(0, 3);
    },
    initialData: [],
  });



  // Fetch organizers for featured trips
  const { data: organizers = [] } = useQuery({
    queryKey: ['home-organizers'],
    queryFn: () => Organizer.list(),
    initialData: [],
  });

  // Create organizer map
  const organizerMap = React.useMemo(() => {
    const map = {};
    organizers.forEach(org => {
      if (org?.organizer_code) map[org.organizer_code] = org;
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
          <section className="relative min-h-screen flex items-center justify-center text-center">
            {/* Full-viewport hero image */}
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
              fetchPriority="high"
              decoding="sync"
              width="1920"
              height="1280"
            />
            {/* Deep Forest gradient overlay — bottom 50% */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c281c] via-[#0c281c]/40 to-transparent" />

            <div className="relative z-10 container px-4 max-w-3xl mx-auto">
              <h1
                className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight text-[#f0e3c7] drop-shadow-lg"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {t('home.hero_title_seo')}
              </h1>
              <p className="mt-4 text-base sm:text-lg md:text-xl text-[#f0e3c7]/80 drop-shadow-md leading-relaxed">
                {t('home.hero_subtitle_seo')}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link to={createPageUrl("Calendar")}>
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-[#8B6914] hover:bg-[#8B6914]/90 text-[#0c281c] font-bold rounded-full px-8 min-h-[48px] text-base shadow-lg"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {t('home.browse_expeditions')}
                  </Button>
                </Link>
                <Link to={createPageUrl("OrganizersList")}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto border-[#f0e3c7]/50 text-[#f0e3c7] hover:bg-[#f0e3c7]/10 rounded-full px-8 min-h-[48px] text-base"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {t('home.meet_organizers')}
                  </Button>
                </Link>
              </div>
              <p className="mt-6 text-sm text-[#f0e3c7]/60 max-w-md mx-auto leading-relaxed">
                {t('home.signup_free')}
              </p>
            </div>
          </section>

          {featuredExpeditions.length > 0 && (
            /* Below the hero fold — defer layout/paint until the user scrolls */
            <section
              className="py-16 px-4 bg-background"
              style={{ contentVisibility: 'auto', containIntrinsicSize: '0 600px' }}
            >
              <div className="container mx-auto max-w-6xl">
                <h2
                  className="text-3xl md:text-4xl font-bold text-center mb-12 text-[#0c281c]"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {t('home.featured_expeditions')}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {featuredExpeditions.map(trip => {
                    const organizer = organizerMap[trip.organizer_code];
                    const formattedDate = format(new Date(trip.start_date), "MMM d, yyyy");
                    const price = formatPriceForCard(trip, language);
                    return (
                      <Link key={trip.id} to={`${createPageUrl("TripDetails")}?id=${trip.id}`} className="block" aria-label={`${t('home.view_details')}: ${trip.title}`}>
                        <div className="relative rounded-xl overflow-hidden group cursor-pointer aspect-[4/3] shadow-md hover:shadow-xl transition-shadow duration-300">
                          {/* Full-bleed photo */}
                          <OptimizedImage
                            src={getTripImage(trip.image_url, trip.id)}
                            alt={trip.title}
                            width={800}
                            height={600}
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            onError={(e) => handleImageError(e, trip.id)}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          {/* Deep Forest gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0c281c] via-[#0c281c]/50 to-transparent" />
                          {/* Content */}
                          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                            {trip.difficulty && (
                              <span className="text-xs font-bold bg-[#8B6914] text-[#f0e3c7] px-2.5 py-0.5 rounded-full uppercase tracking-wide" style={{ fontFamily: 'var(--font-heading)' }}>
                                {trip.difficulty}
                              </span>
                            )}
                            <h3 className="font-bold text-[#f0e3c7] text-lg leading-tight line-clamp-2" style={{ fontFamily: 'var(--font-heading)' }}>
                              {trip.title}
                            </h3>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-[#f0e3c7]/80 text-sm">
                                <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>{formattedDate}</span>
                              </div>
                              <span className="font-bold text-[#8B6914] text-base" style={{ fontFamily: 'var(--font-heading)' }}>
                                {price}
                              </span>
                            </div>
                            {organizer && (
                              <div className="flex items-center gap-1.5 text-[#f0e3c7]/60 text-xs">
                                <UserIcon className="w-3 h-3" aria-hidden="true" />
                                <span>by {organizer.full_name || organizer.username}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
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
