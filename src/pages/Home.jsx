import React, { useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { prefetchCalendarData, prefetchTripDetails } from '@/lib/prefetch';

import { Calendar, User as UserIcon, Search, Mountain, ArrowRight, MapPin, Users, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '../components/contexts/LanguageContext';
import { useTranslation } from '../components/translations/useTranslations';
import useSEO from '../components/seo/useSEO';
import StructuredData from '../components/seo/StructuredData';
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
  const [searchQuery, setSearchQuery] = React.useState('');

  // Prefetch Calendar data on mount so navigating there is instant
  useEffect(() => { prefetchCalendarData(); }, []);

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

  // Enhanced Structured Data for Organization + LocalBusiness with target keywords
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "TouristInformationCenter"],
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
      "addressCountry": "GR",
      "addressLocality": "Athens",
      "addressRegion": "Attica"
    },
    "priceRange": "€€",
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
      "opens": "00:00",
      "closes": "23:59"
    },
    "hasMap": "https://www.google.com/maps/place/Greece",
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

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    navigate(`${createPageUrl("Calendar")}?search=${encodeURIComponent(searchQuery.trim())}`);
  }, [navigate, searchQuery]);

  const difficultyCategories = language === 'el'
    ? [
        { label: 'Εύκολο', value: 'easy', icon: '🌿', desc: 'Ιδανικό για αρχάριους' },
        { label: 'Μέτριο', value: 'moderate', icon: '🏔️', desc: 'Λίγη εμπειρία απαιτείται' },
        { label: 'Δύσκολο', value: 'hard', icon: '⛰️', desc: 'Για έμπειρους πεζοπόρους' },
        { label: 'Πολυήμερο', value: 'multi-day', icon: '🏕️', desc: 'Εκδρομές πολλών ημερών' },
      ]
    : [
        { label: 'Easy', value: 'easy', icon: '🌿', desc: 'Perfect for beginners' },
        { label: 'Moderate', value: 'moderate', icon: '🏔️', desc: 'Some experience needed' },
        { label: 'Hard', value: 'hard', icon: '⛰️', desc: 'For seasoned hikers' },
        { label: 'Multi-day', value: 'multi-day', icon: '🏕️', desc: 'Extended expeditions' },
      ];

  return (
    <>
      <StructuredData data={organizationSchema} />
      <StructuredData data={websiteSchema} />
      <StructuredData data={faqSchema} />

      <div className="flex flex-col min-h-screen">
        <main className="flex-1">

          {/* ─── Hero Section ─── */}
          <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-4 pt-16 pb-24">
            {/* Background image */}
            <img
              src="https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=1200&q=80&fm=webp"
              srcSet="https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=600&q=80&fm=webp 600w,
                      https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=1200&q=80&fm=webp 1200w,
                      https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=1920&q=80&fm=webp 1920w"
              sizes="100vw"
              alt={language === 'el'
                ? "Πεζοπορία στα ελληνικά βουνά - ομάδες πεζοπορίας σε ορειβατική διαδρομή"
                : "Hiking in Greek mountains - hiking teams on mountain trail with panoramic views"}
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
              // eslint-disable-next-line react/no-unknown-property
              fetchpriority="high"
              decoding="sync"
              width="1920"
              height="1280"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/70 via-brand-dark/50 to-brand-dark/80" />

            <div className="relative z-10 w-full max-w-3xl mx-auto space-y-6">
              {/* Eyebrow */}
              <p className="text-brand-gold-accent font-semibold text-sm uppercase tracking-widest" style={{ fontFamily: 'var(--font-heading)' }}>
                {language === 'el' ? 'Nature Explorers — Ελλάδα' : 'Nature Explorers — Greece'}
              </p>

              {/* Headline */}
              <h1
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight text-brand-gold drop-shadow-lg"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {t('home.hero_title_seo')}
              </h1>
              <p className="text-base sm:text-lg text-brand-gold/80 max-w-xl mx-auto leading-relaxed">
                {t('home.hero_subtitle_seo')}
              </p>

              {/* Search bar */}
              <form onSubmit={handleSearch} className="w-full max-w-xl mx-auto mt-2">
                <div className="flex items-center bg-white rounded-full shadow-2xl overflow-hidden pl-5 pr-2 py-2 gap-2">
                  <label htmlFor="hero-search" className="sr-only">
                    {language === 'el' ? 'Αναζήτησε εκδρομή ή τοποθεσία' : 'Search trips or location'}
                  </label>
                  <Search className="w-5 h-5 text-brand-dark/50 flex-shrink-0" aria-hidden="true" />
                  <input
                    id="hero-search"
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={language === 'el' ? 'Αναζήτησε εκδρομή, τοποθεσία…' : 'Search trips, location…'}
                    className="flex-1 bg-transparent text-brand-dark placeholder-brand-dark/40 text-base outline-none min-w-0"
                  />
                  <button
                    type="submit"
                    className="bg-brand-dark hover:bg-brand-dark/90 text-brand-gold font-bold rounded-full px-5 py-2.5 text-sm transition-colors flex-shrink-0"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {language === 'el' ? 'Αναζήτηση' : 'Search'}
                  </button>
                </div>
              </form>

              {/* Quick stats */}
              <div className="flex items-center justify-center gap-6 text-brand-gold/70 text-sm flex-wrap mt-2">
                <span className="flex items-center gap-1.5"><Mountain className="w-4 h-4" />{language === 'el' ? 'Εκατοντάδες εκδρομές' : 'Hundreds of trips'}</span>
                <span className="text-brand-gold/30">·</span>
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{language === 'el' ? 'Έμπειροι οδηγοί' : 'Expert guides'}</span>
                <span className="text-brand-gold/30">·</span>
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{language === 'el' ? 'Όλη η Ελλάδα' : 'All over Greece'}</span>
              </div>
            </div>
          </section>

          {/* ─── Explore by Difficulty ─── */}
          <section className="py-14 px-4 bg-brand-dark" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 280px' }}>
            <div className="container mx-auto max-w-5xl">
              <div className="flex items-center justify-between mb-8">
                <h2
                  className="text-2xl md:text-3xl font-bold text-brand-gold"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {language === 'el' ? 'Εξερεύνησε κατά Δυσκολία' : 'Explore by Difficulty'}
                </h2>
                <Link
                  to={createPageUrl("Calendar")}
                  className="flex items-center gap-1 text-brand-gold-accent hover:text-brand-gold-accent/80 text-sm font-semibold transition-colors"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {language === 'el' ? 'Δες όλες' : 'See all'}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {difficultyCategories.map(cat => (
                  <Link
                    key={cat.value}
                    to={createPageUrl("Calendar")}
                    className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-brand-gold/10 hover:bg-brand-gold/20 border border-brand-gold/10 hover:border-brand-gold-accent/40 transition-all duration-200 text-center cursor-pointer"
                  >
                    <span className="text-4xl" role="img" aria-label={cat.label}>{cat.icon}</span>
                    <div>
                      <p className="font-bold text-brand-gold text-sm" style={{ fontFamily: 'var(--font-heading)' }}>{cat.label}</p>
                      <p className="text-brand-gold/50 text-xs mt-0.5">{cat.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* ─── Featured Expeditions ─── */}
          {featuredExpeditions.length > 0 && (
            <section
              className="py-16 px-4 bg-background"
              style={{ contentVisibility: 'auto', containIntrinsicSize: '0 600px' }}
            >
              <div className="container mx-auto max-w-6xl">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h2
                      className="text-3xl md:text-4xl font-bold text-brand-dark"
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      {t('home.featured_expeditions')}
                    </h2>
                    <p className="text-brand-dark/60 mt-1 text-sm">
                      {language === 'el' ? 'Επιλεγμένες εκδρομές που ξεχωρίζουν' : 'Handpicked trips worth exploring'}
                    </p>
                  </div>
                  <Link
                    to={createPageUrl("Calendar")}
                    className="hidden sm:flex items-center gap-1 text-brand-gold-accent hover:text-brand-gold-accent/80 text-sm font-semibold transition-colors"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {language === 'el' ? 'Δες όλες' : 'See all'}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {featuredExpeditions.map(trip => {
                    const organizer = organizerMap[trip.organizer_code];
                    const formattedDate = format(new Date(trip.start_date), "MMM d, yyyy");
                    const price = formatPriceForCard(trip, language);
                    return (
                      <Link key={trip.id} to={`${createPageUrl("TripDetails")}?id=${trip.id}`} className="block" aria-label={`${t('home.view_details')}: ${trip.title}`} onPointerEnter={() => prefetchTripDetails(trip.id)}>
                        <div className="relative rounded-xl overflow-hidden group cursor-pointer aspect-[4/3] shadow-md hover:shadow-xl transition-shadow duration-300">
                          <OptimizedImage
                            src={getTripImage(trip.image_url, trip.id)}
                            alt={trip.title}
                            width={800}
                            height={600}
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            onError={(e) => handleImageError(e, trip.id)}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/50 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                            {trip.difficulty && (
                              <span className="text-xs font-bold bg-brand-gold-accent text-brand-gold px-2.5 py-0.5 rounded-full uppercase tracking-wide" style={{ fontFamily: 'var(--font-heading)' }}>
                                {trip.difficulty}
                              </span>
                            )}
                            <h3 className="font-bold text-brand-gold text-lg leading-tight line-clamp-2" style={{ fontFamily: 'var(--font-heading)' }}>
                              {trip.title}
                            </h3>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-brand-gold/80 text-sm">
                                <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>{formattedDate}</span>
                              </div>
                              <span className="font-bold text-brand-gold-accent text-base" style={{ fontFamily: 'var(--font-heading)' }}>
                                {price}
                              </span>
                            </div>
                            {organizer && (
                              <div className="flex items-center gap-1.5 text-brand-gold/60 text-xs">
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

                <div className="mt-8 text-center sm:hidden">
                  <Link to={createPageUrl("Calendar")}>
                    <Button className="bg-brand-dark hover:bg-brand-dark/90 rounded-full px-8" style={{ fontFamily: 'var(--font-heading)' }}>
                      {t('home.browse_expeditions')}
                    </Button>
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* ─── Organizer CTA strip ─── */}
          <section
            className="py-16 px-4 bg-brand-gold"
            style={{ contentVisibility: 'auto', containIntrinsicSize: '0 200px' }}
          >
            <div className="container mx-auto max-w-4xl text-center space-y-5">
              <TrendingUp className="w-10 h-10 mx-auto text-brand-dark/40" aria-hidden="true" />
              <h2
                className="text-3xl md:text-4xl font-bold text-brand-dark"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {language === 'el' ? 'Είσαι οργανωτής εκδρομών;' : 'Are you a trip organizer?'}
              </h2>
              <p className="text-brand-dark/70 max-w-lg mx-auto text-base leading-relaxed">
                {language === 'el'
                  ? 'Ανέβασε τις εκδρομές σου, διαχειρίσου κρατήσεις και φτάσε σε χιλιάδες πεζοπόρους.'
                  : 'List your trips, manage bookings, and reach thousands of hikers across Greece.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link to={createPageUrl("OrganizersList")}>
                  <Button
                    size="lg"
                    className="bg-brand-dark hover:bg-brand-dark/90 text-brand-gold font-bold rounded-full px-8 min-h-[48px]"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {t('home.meet_organizers')}
                  </Button>
                </Link>
                {!user && (
                  <Link to={createPageUrl("Login")}>
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-brand-dark/40 text-brand-dark hover:bg-brand-dark/10 rounded-full px-8 min-h-[48px]"
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      {language === 'el' ? 'Εγγραφή δωρεάν' : 'Sign up free'}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </section>

        </main>
      </div>
    </>
  );
}
