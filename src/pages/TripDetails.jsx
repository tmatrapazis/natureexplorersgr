import React, { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import BookingForm from "@/components/bookings/BookingForm";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Clock, TrendingUp, Users, Euro, ExternalLink, User as UserIcon, LogIn, Eye } from "lucide-react";
import { format } from 'date-fns';

import { getComputedTripStatus, statusColors, difficultyColors } from "../components/helpers/tripHelpers";
import { formatDateRange } from "../components/helpers/dateHelpers";
import { trackEvent } from "../components/analytics/GoogleAnalytics";
import { useLanguage } from "../components/contexts/LanguageContext";
import { useTranslation } from "../components/translations/useTranslations";
import { useBackNavigation } from '../lib/useBackNavigation';
import StructuredData from "../components/seo/StructuredData";
import { getTripImage, handleImageError } from "../components/helpers/imageHelpers";
import OptimizedImage from "@/components/ui/OptimizedImage";
import ShareButton from "../components/trip/ShareButton";
import DOMPurify from "dompurify";
import { getPricingOptions, getLowestPrice } from "../components/helpers/pricingHelpers";
import LazyTripLocationMap from "@/components/lazy/LazyTripLocationMap";
import { useAuth } from "@/lib/AuthContext";
import { HikingTrip, Organizer, Booking } from "@/api/db";

// Helper function to check if URL is a social media link
const isSocialMediaUrl = (url) => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  const socialDomains = [
    'facebook.com',
    'fb.com',
    'instagram.com',
    'twitter.com',
    'x.com',
    'linkedin.com',
    'tiktok.com',
    'youtube.com',
    'whatsapp.com',
    'telegram.org',
    't.me'
  ];
  return socialDomains.some(domain => lowerUrl.includes(domain));
};

export default function TripDetailsPage() {
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Freeze at mount time — prevents redirect firing during AnimatePresence
  // exit animation when the URL has already changed to the next page.
  const tripId = React.useRef(searchParams.get("id")).current;
  const { goBack: handleGoBack } = useBackNavigation(createPageUrl("Calendar"));
  const { user } = useAuth();
  const [showBookingForm, setShowBookingForm] = useState(false);

  // Redirect to homepage if no trip ID provided
  React.useEffect(() => {
    if (!tripId) {
      navigate('/', { replace: true });
    }
  }, [tripId, navigate]);

  const { data: trip, isLoading: tripLoading } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      const trips = await HikingTrip.filter({ id: tripId });
      return trips[0];
    },
    enabled: !!tripId,
  });

  // Fetch organizer data using organizer_code
  const { data: organizer } = useQuery({
    queryKey: ['trip-organizer', trip?.organizer_code],
    queryFn: async () => {
      const organizers = await Organizer.filter({ organizer_code: trip.organizer_code });
      return organizers[0];
    },
    enabled: !!trip?.organizer_code,
  });

  // Check if the current hiker already has a booking for this trip
  const { data: existingBooking } = useQuery({
    queryKey: ['my-booking-for-trip', tripId, user?.id],
    queryFn: async () => {
      const results = await Booking.filter({ trip_id: tripId, user_id: user.id });
      // Return the most recent active booking (ignore cancelled/declined)
      return results.find(b => b.status !== 'cancelled' && b.status !== 'declined') ?? null;
    },
    enabled: !!user?.id && !!tripId,
    staleTime: 30 * 1000,
  });

  // Availability is read directly from trip.pricing_options[tier].remaining.
  // That field is maintained by BookingCard when the organizer confirms/declines.

  // Track trip page view when trip data is loaded
  React.useEffect(() => {
    if (trip && organizer) {
      trackEvent('trip_page_view', {
        event_category: 'Trip Content',
        event_label: trip.title,
        trip_id: trip.id,
        organizer_name: organizer?.username || organizer?.full_name || 'Unknown',
        difficulty: trip.difficulty,
        price: trip.price,
        location: trip.location,
      });
    }
  }, [trip, organizer]);

  // Increment view count (once per session per trip, exclude admin users)
  React.useEffect(() => {
    if (trip?.id && user?.role !== 'admin') {
      const viewedTripsKey = 'viewed_trips';
      const viewedTrips = JSON.parse(sessionStorage.getItem(viewedTripsKey) || '[]');

      if (!viewedTrips.includes(trip.id)) {
        // Mark as viewed in session
        sessionStorage.setItem(viewedTripsKey, JSON.stringify([...viewedTrips, trip.id]));

        // Increment view count in database (best-effort — hikers may lack write RLS)
        const newCount = (trip.view_count || 0) + 1;
        HikingTrip.update(trip.id, { view_count: newCount }).catch(() => {});
      }
    }
  }, [trip?.id, user?.role]);

  // SEO Configuration with keywords - Dynamic based on trip data
  React.useEffect(() => {
    if (trip) {
      const tripTitle = language === 'el'
        ? `${trip.title} | Πεζοπορία ${trip.location} | Trekking Ελλάδα | Nature Explorers`
        : `${trip.title} - Hiking in ${trip.location} | Trekking Greece | Nature Explorers`;

      document.title = tripTitle;

      const updateMetaTag = (name, content, isProperty = false) => {
        if (!content) return;
        const attribute = isProperty ? 'property' : 'name';
        let element = document.querySelector(`meta[${attribute}="${name}"]`);
        if (!element) {
          element = document.createElement('meta');
          element.setAttribute(attribute, name);
          document.head.appendChild(element);
        }
        element.setAttribute('content', content);
      };

      const description = trip.description
        ? trip.description.substring(0, 150) + (trip.description.length > 150 ? '...' : '')
        : language === 'el'
          ? `Συμμετάσχετε σε αυτή την ${trip.difficulty} πεζοπορική εκδρομή στο ${trip.location}. ${trip.distance_km ? `Διαδρομή ${trip.distance_km}km.` : ''} Outdoor περιπέτεια ορειβασίας με έμπειρο οδηγό. Οργανωμένες εκδρομές βουνό και hiking adventures Greece.`
          : `Join this ${trip.difficulty} hiking trip in ${trip.location}. ${trip.distance_km ? `${trip.distance_km}km mountain trekking route.` : ''} Outdoor adventure with experienced guide. Hiking tours Greece and weekend hiking trips.`;

      updateMetaTag('description', description);
      updateMetaTag('keywords', language === 'el'
        ? `πεζοπορία, ${trip.location}, εκδρομές, ορειβασία, trekking, outdoor activities, ${trip.difficulty}, hiking greece, οργανωμένες εκδρομές βουνού, πεζοπορικές διαδρομές`
        : `hiking, ${trip.location}, trekking, outdoor activities, mountain adventure, ${trip.difficulty}, hiking greece, hiking trips greece, weekend hiking, one day hikes`);
      const canonicalUrl = `https://natureexplorers.gr/tripdetails?id=${trip.id}`;
      updateMetaTag('og:title', tripTitle, true);
      updateMetaTag('og:description', description, true);
      updateMetaTag('og:image', trip.image_url, true);
      updateMetaTag('og:url', canonicalUrl, true);
      updateMetaTag('og:type', 'event', true);
      updateMetaTag('twitter:card', 'summary_large_image');
      updateMetaTag('twitter:title', tripTitle);
      updateMetaTag('twitter:description', description);
      updateMetaTag('twitter:image', trip.image_url);

      // Set canonical link tag
      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute('href', canonicalUrl);
    }
  }, [trip, language]);

  // Enhanced Structured Data for Event with keywords - Optimized for Google Search
  const eventSchema = trip ? {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    "name": trip.title,
    "description": trip.description || (language === 'el'
      ? `Πεζοπορική εκδρομή ${trip.difficulty} επιπέδου στο ${trip.location}. Οργανωμένες εκδρομές βουνό, outdoor περιπέτεια ορειβασίας και trekking με έμπειρο οδηγό. Ημερολόγιο εκδρομών Nature Explorers Greece.`
      : `${trip.difficulty} level hiking trip and trekking adventure in ${trip.location}. Outdoor mountain expedition with experienced guide. Hiking calendar and weekend hiking trips Greece.`),
    "image": [trip.image_url || getTripImage(null, trip.id)],
    "startDate": trip.start_date + (trip.start_time ? `T${trip.start_time}:00` : 'T09:00:00'),
    "endDate": (trip.end_date || trip.start_date) + 'T18:00:00',
    "location": {
      "@type": "Place",
      "name": trip.location,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": trip.location,
        "addressRegion": trip.location,
        "addressCountry": "GR"
      }
    },
    "organizer": organizer ? {
      "@type": organizer.website ? "Organization" : "Person",
      "name": organizer.username || organizer.full_name,
      "url": organizer.website || `${window.location.origin}/organizerprofile/${organizer.username || organizer.organizer_code}`,
      "telephone": organizer.phone,
      "email": organizer.email,
      "image": organizer.profile_picture_url
    } : {
      "@type": "Organization",
      "name": "Nature Explorers",
      "url": window.location.origin
    },
    "performer": organizer ? {
      "@type": "Person",
      "name": organizer.username || organizer.full_name
    } : undefined,
    "offers": {
      "@type": "Offer",
      "price": getLowestPrice(trip) || 0,
      "priceCurrency": "EUR",
      "url": trip.event_url || window.location.href,
      "availability": trip.status === 'cancelled' ? "https://schema.org/SoldOut" :
                      trip.status === 'almost soldout' ? "https://schema.org/LimitedAvailability" :
                      "https://schema.org/InStock",
      "validFrom": trip.created_date || trip.start_date
    },
    "eventStatus": trip.status === 'cancelled'
      ? "https://schema.org/EventCancelled"
      : trip.status === 'completed'
      ? "https://schema.org/EventScheduled"
      : "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "sport": language === 'el' ? "Πεζοπορία και Ορειβασία" : "Hiking and Trekking",
    "keywords": language === 'el'
      ? `πεζοπορία, ${trip.location}, εκδρομές, ορειβασία, trekking, outdoor, ${trip.difficulty}, οργανωμένες εκδρομές βουνού, hiking greece`
      : `hiking, ${trip.location}, trekking, outdoor activities, mountain adventure, ${trip.difficulty}, hiking trips greece, weekend hiking`,
    "inLanguage": language === 'el' ? "el" : "en",
    "typicalAgeRange": "18-65",
    "maximumAttendeeCapacity": trip.max_participants,
    "isAccessibleForFree": trip.price === 0 || !trip.price,
    "url": window.location.href
  } : null;

  // Breadcrumb structured data for better navigation
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": window.location.origin
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Calendar",
        "item": `${window.location.origin}${createPageUrl("Calendar")}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": trip?.title || "Trip Details",
        "item": window.location.href
      }
    ]
  };

  if (tripLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0c281c]" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">{t('trip.trip_not_found')}</h2>
          <Link to={createPageUrl("Calendar")} aria-label={t('trip.back_to_calendar')}>
            <Button className="min-h-[44px]" tabIndex={-1}>{t('trip.back_to_calendar')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const computedStatus = getComputedTripStatus(trip);
  const isSocialMedia = isSocialMediaUrl(trip.event_url);

  // Considers plan_expires_at — raw organizer.plan column is not enough
  const organizerIsActivePremium =
    organizer?.plan === 'premium' &&
    (!organizer?.plan_expires_at || new Date(organizer.plan_expires_at) > new Date());

  // Trip is fully booked when every tier that has a slot limit is at 0 remaining
  // and there are no unlimited tiers.
  const pricingOptionsForCheck = trip?.pricing_options?.length > 0 ? trip.pricing_options : [];
  const hasUnlimitedTier = pricingOptionsForCheck.some(t => !t.slots);
  const allLimitedTiersFull = pricingOptionsForCheck.length > 0 &&
    !hasUnlimitedTier &&
    pricingOptionsForCheck.every(t => t.slots && (t.remaining ?? t.slots) === 0);
  const tripFullyBooked = allLimitedTiersFull;

  // Handler for "Book Now" button clicks
  const handleBookNowClick = () => {
    trackEvent('book_now_click', {
      event_category: 'Booking',
      event_label: trip.title,
      trip_id: trip.id,
      organizer_name: organizer ? (organizer.username || organizer.full_name) : 'Unknown',
      destination_url: trip.event_url,
      is_social_media: isSocialMedia,
      price: trip.price,
      difficulty: trip.difficulty,
    });
    // trackBookClick removed — base44 function no longer available
  };

  // Handler for external link button clicks
  const handleExternalLinkClick = () => {
    trackEvent('external_link_click', {
      event_category: 'Engagement',
      event_label: trip.title,
      trip_id: trip.id,
      destination_url: trip.external_link,
    });
  };

  // If user is not logged in, show limited details with login prompt
  if (!user) {
    return (
      <>
        {eventSchema && <StructuredData data={eventSchema} />}
        <StructuredData data={breadcrumbSchema} />
        <div className="min-h-screen bg-gradient-to-br from-stone-50 via-[#f0e3c7]/30 to-stone-50 p-4 md:p-8">
          <div className="max-w-5xl mx-auto">
            <Button
              variant="outline"
              className="hidden md:inline-flex mb-6"
              aria-label="Go back"
              onClick={handleGoBack}
            >
              <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
              Back
            </Button>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {trip.image_url && (
                  <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden shadow-lg">
                    <OptimizedImage
                      src={getTripImage(trip.image_url, trip.id)}
                      alt={language === 'el'
                        ? `${trip.title} - πεζοπορική εκδρομή ${trip.location} Ελλάδα, outdoor ορειβασία trekking`
                        : `${trip.title} - hiking trekking expedition in ${trip.location} Greece, outdoor mountain adventure`}
                      width={1200}
                      height={600}
                      sizes="(max-width: 1024px) 100vw, 66vw"
                      onError={(e) => handleImageError(e, trip.id)}
                      priority
                    />
                    <Badge className={`absolute top-4 right-4 z-10 text-base px-3 py-1 ${statusColors[computedStatus]}`}>
                      {computedStatus}
                    </Badge>
                  </div>
                )}

                <Card className="p-6">
                  <h1 className="text-3xl md:text-4xl font-bold text-[#0c281c] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>{trip.title}</h1>

                  {organizer && (
                    <Link
                      to={`${createPageUrl("OrganizerProfile")}?code=${organizer.organizer_code}`}
                      className="inline-flex items-center gap-2 text-muted-foreground hover:text-[#0c281c] mb-4"
                    >
                      <UserIcon className="w-4 h-4" />
                      <span>{t('trip.organized_by')} {organizer.username || organizer.full_name}</span>
                    </Link>
                  )}

                  <div className="flex flex-wrap gap-2 mb-6">
                    <Badge className={`${difficultyColors[trip.difficulty]} border`}>
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {trip.difficulty}
                    </Badge>
                    {trip.distance_km && (
                      <Badge variant="outline">{trip.distance_km} km</Badge>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-[#0c281c]" />
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium text-foreground">{trip.location}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-[#0c281c]" />
                      <div>
                        <p className="text-sm text-muted-foreground">Date</p>
                        <p className="font-medium text-foreground">
                          {formatDateRange(trip.start_date, trip.end_date)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {trip.description && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-foreground mb-2">Description</h3>
                      {/* Sanitise before rendering so Quill-generated HTML is displayed
                          correctly for logged-out users instead of showing raw tags. */}
                      <div
                        className="text-muted-foreground break-words overflow-hidden line-clamp-4"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(trip.description) }}
                      />
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                    <LogIn className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-foreground mb-2">{t('trip.login_to_see_details')}</h3>
                    <p className="text-muted-foreground mb-4">
                      {t('trip.login_message')}
                    </p>
                    <Button
                      onClick={() => navigate(`/login?redirect=${encodeURIComponent(window.location.href)}`)}
                      className="bg-[#0c281c] hover:bg-[#0c281c]/90 min-h-[44px]"
                      aria-label={t('trip.login_to_continue')}
                    >
                      <LogIn className="w-4 h-4 mr-2" aria-hidden="true" />
                      {t('trip.login_to_continue')}
                    </Button>
                  </div>
                </Card>
              </div>

              <div>
                <Card className="p-6 sticky top-6">
                  <div className="text-center py-6">
                    <Users className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-foreground mb-2">{t('trip.login_required')}</h3>
                    <p className="text-muted-foreground mb-4">
                      {t('trip.login_message')}
                    </p>
                    <Button
                      onClick={() => navigate(`/login?redirect=${encodeURIComponent(window.location.href)}`)}
                      className="w-full bg-[#0c281c] hover:bg-[#0c281c]/90 min-h-[44px]"
                      aria-label={t('common.login')}
                    >
                      <LogIn className="w-4 h-4 mr-2" aria-hidden="true" />
                      {t('common.login')}
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Full details for logged-in users
  return (
    <>
      {eventSchema && <StructuredData data={eventSchema} />}
      <StructuredData data={breadcrumbSchema} />
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-[#f0e3c7]/30 to-stone-50 p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <Button
            variant="outline"
            className="hidden md:inline-flex mb-6"
            aria-label="Go back"
            onClick={handleGoBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
            Back
          </Button>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {trip.image_url && (
                <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden shadow-lg flex items-center justify-center bg-muted">
                  <img
                    src={getTripImage(trip.image_url, trip.id)}
                    alt={language === 'el'
                      ? `${trip.title} - πεζοπορική εκδρομή ${trip.location} Ελλάδα, outdoor ορειβασία trekking`
                      : `${trip.title} - hiking trekking expedition in ${trip.location} Greece, outdoor mountain adventure`}
                    className="w-full h-full object-cover"
                    onError={(e) => handleImageError(e, trip.id)}
                  />
                  <Badge className={`absolute top-4 right-4 text-base px-3 py-1 ${statusColors[computedStatus]}`}>
                    {computedStatus}
                  </Badge>
                </div>
              )}

              <Card className="p-6 relative">
                <div className="absolute top-6 right-6 hidden md:block">
                  <ShareButton trip={trip} language={language} />
                </div>

                {/* pr-20 only on md+ where the absolute ShareButton is visible */}
                <h1 className="text-3xl md:text-4xl font-bold text-[#0c281c] mb-2 pr-0 md:pr-20" style={{ fontFamily: 'var(--font-heading)' }}>{trip.title}</h1>

                {organizer && (
                  <Link
                    to={`${createPageUrl("OrganizerProfile")}?code=${organizer.organizer_code}`}
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-[#0c281c] mb-4 transition-colors"
                  >
                    <UserIcon className="w-4 h-4" />
                    <span>{t('trip.organized_by')} {organizer.username || organizer.full_name}</span>
                  </Link>
                )}

                <div className="flex flex-wrap gap-2 mb-6">
                  <Badge className={`${difficultyColors[trip.difficulty]} border`}>
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {trip.difficulty}
                  </Badge>
                  {user?.role === 'admin' && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {trip.view_count || 0} {language === 'el' ? 'προβολές' : 'views'}
                    </Badge>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-[#0c281c]" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t('trip.location')}</p>
                      <p className="font-medium text-foreground">{trip.location}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-[#0c281c]" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t('trip.date')}</p>
                      <p className="font-medium text-foreground">
                        {formatDateRange(trip.start_date, trip.end_date)} {trip.start_time && `at ${trip.start_time}`}
                      </p>
                    </div>
                  </div>

                  {trip.duration_hours && (
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-[#0c281c]" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t('trip.duration')}</p>
                        <p className="font-medium text-foreground">{trip.duration_hours} {t('trip.hours')}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <Euro className="w-5 h-5 text-[#0c281c] mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t('trip.price')}</p>
                      {(() => {
                        const pricingOptions = getPricingOptions(trip);
                        if (pricingOptions.length === 0) return <p className="font-medium text-foreground">TBA</p>;
                        return (
                          <div className="space-y-1 mt-1">
                            {pricingOptions.map((option, i) => {
                              const availability = option.slots
                                ? (option.remaining ?? option.slots)
                                : null;
                              return (
                                <div key={i} className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-medium text-foreground">€{option.price}</span>
                                  <span className="text-sm text-muted-foreground">— {option.label}</span>
                                  {availability !== null && (
                                    <span className={`text-xs ${availability === 0 ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                                      ({availability === 0 ? (language === 'el' ? 'Πλήρες' : 'Full') : `${availability} ${language === 'el' ? 'θέσεις' : 'spots left'}`})
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {trip.departure_from && trip.departure_from.length > 0 && (
                    <div className="flex items-center gap-3 md:col-start-2">
                      <MapPin className="w-5 h-5 text-[#0c281c]" />
                      <div>
                        <p className="text-sm text-muted-foreground">{language === 'el' ? 'Αναχώρηση Από' : 'Departure From'}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {trip.departure_from.map((location, i) => (
                            <span key={i} className="text-sm font-medium text-foreground">
                              {location}{i < trip.departure_from.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {trip.meeting_points && trip.meeting_points.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-foreground mb-3">{t('trip.meeting_points')}</h3>
                    <div className="space-y-3">
                      {trip.meeting_points.map((point, index) => (
                        <div key={index} className="bg-muted/30 p-3 rounded-lg">
                          <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-[#0c281c] mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{point.name}</p>
                              <p className="text-sm text-muted-foreground mt-1">{point.location}</p>
                              {point.time && (
                                <div className="flex items-center gap-2 mt-2">
                                  <Clock className="w-4 h-4 text-muted-foreground" />
                                  <p className="text-sm text-muted-foreground">{point.time}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {trip.description && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-foreground mb-2">{t('trip.description')}</h3>
                    <div
                      className="text-muted-foreground break-words overflow-hidden"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(trip.description) }}
                    />
                  </div>
                )}

                {trip.tags && trip.tags.length > 0 && (
                  <div
                    className="mb-6"
                    style={{ contentVisibility: 'auto', containIntrinsicSize: '0 80px' }}
                  >
                    <h3 className="font-semibold text-foreground mb-2">{language === 'el' ? 'Ετικέτες' : 'Tags'}</h3>
                    <div className="flex flex-wrap gap-2">
                      {trip.tags.map((tag, i) => {
                        const isTransportTag = tag === 'bus' || tag === 'organized-carpooling';
                        return (
                          <Badge
                            key={i}
                            className={isTransportTag
                              ? "bg-purple-100 text-purple-800 border-purple-300 border font-semibold"
                              : "bg-[#f0e3c7]/40 text-[#0c281c] border-[#0c281c]/20 border"
                            }
                          >
                            {tag}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                {trip.requirements && trip.requirements.length > 0 && (
                  <div style={{ contentVisibility: 'auto', containIntrinsicSize: '0 160px' }}>
                    <h3 className="font-semibold text-foreground mb-2">{t('trip.what_to_bring')}</h3>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      {trip.requirements.map((req, i) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {trip.external_link && (
                  <div className="mt-6 pt-6 border-t">
                    <a
                      href={trip.external_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={handleExternalLinkClick}
                      className="inline-flex items-center gap-2 text-[#0c281c] hover:text-[#0c281c] font-medium"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {t('trip.external_link')}
                    </a>
                  </div>
                )}
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="p-6">
                <div className="text-center py-6">
                  <Users className="w-16 h-16 text-[#f0e3c7]/70 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-foreground mb-2">{t('trip.interested_in_trip')}</h3>
                  <p className="text-muted-foreground mb-4">
                    {organizerIsActivePremium
                      ? 'Request your spot directly through the platform.'
                      : isSocialMedia
                        ? t('trip.contact_organizer')
                        : t('trip.click_to_book')
                    }
                  </p>

                  {/* Active premium organizer — in-app booking */}
                  {organizerIsActivePremium && computedStatus === 'upcoming' && (
                    existingBooking ? (
                      <div className="space-y-2">
                        <div className={`text-sm rounded-lg px-3 py-2.5 text-center font-medium ${
                          existingBooking.status === 'confirmed' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
                          existingBooking.status === 'paid'      ? 'bg-[#f0e3c7]/40 text-[#0c281c] border border-[#0c281c]/20' :
                          'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}>
                          {existingBooking.status === 'confirmed' ? t('booking.already_confirmed') :
                           existingBooking.status === 'paid'      ? t('booking.already_paid') :
                                                                    t('booking.already_pending')}
                        </div>
                        <Link to={createPageUrl('MyBookings')}>
                          <Button variant="outline" className="w-full min-h-[44px]">
                            {t('booking.view_my_bookings')}
                          </Button>
                        </Link>
                      </div>
                    ) : tripFullyBooked ? (
                      <Button disabled className="w-full min-h-[44px]">
                        {t('booking.fully_booked')}
                      </Button>
                    ) : (
                      <Button
                        className="w-full bg-[#0c281c] hover:bg-[#0c281c]/90 min-h-[44px]"
                        onClick={() => {
                          if (!user) {
                            navigate(`/login?redirect=${encodeURIComponent(window.location.href)}`);
                            return;
                          }
                          setShowBookingForm(true);
                          handleBookNowClick();
                        }}
                      >
                        {t('trip.book_now')}
                      </Button>
                    )
                  )}

                  {/* Expired premium organizer with no fallback URL */}
                  {!organizerIsActivePremium && organizer?.plan === 'premium' && !trip.event_url && (
                    <p className="text-sm text-center text-muted-foreground py-2">
                      Booking is temporarily unavailable for this trip.
                    </p>
                  )}

                  {/* Free organizer or expired premium with external URL */}
                  {!organizerIsActivePremium && trip.event_url && (
                    <Button
                      asChild
                      className="w-full bg-[#0c281c] hover:bg-[#0c281c]/90 min-h-[44px]"
                      onClick={handleBookNowClick}
                    >
                      <a href={trip.event_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {isSocialMedia ? t('trip.contact_organizer') : t('trip.book_now')}
                      </a>
                    </Button>
                  )}

                  {!organizerIsActivePremium && !trip.event_url && organizer?.plan !== 'premium' && organizer ? (
                    <Link to={`${createPageUrl("OrganizerProfile")}?code=${organizer.organizer_code}`}>
                      <Button className="w-full bg-[#0c281c] hover:bg-[#0c281c]/90 min-h-[44px]">
                        {t('trip.view_organizer_profile')}
                      </Button>
                    </Link>
                  ) : !organizerIsActivePremium && !trip.event_url && organizer?.plan !== 'premium' && !organizer ? (
                    <p className="text-sm text-muted-foreground">{t('trip.no_booking_info')}</p>
                  ) : null}
                </div>
              </Card>

              {/* Map is below the fold on mobile — skip layout/paint until visible */}
              <div style={{ contentVisibility: 'auto', containIntrinsicSize: '0 380px' }}>
                <Card className="p-4">
                  <LazyTripLocationMap trip={trip} />
                </Card>
              </div>
            </div>
          </div>

          {/* Mobile Share Button - Sticky at bottom */}
          <div className="md:hidden">
            <ShareButton trip={trip} language={language} />
          </div>
        </div>
      </div>

      {/* In-app booking modal — only rendered for Premium organizer trips */}
      {showBookingForm && (
        <BookingForm
          trip={trip}
          organizer={organizer}
          open={showBookingForm}
          onClose={() => setShowBookingForm(false)}
        />
      )}
    </>
  );
}
