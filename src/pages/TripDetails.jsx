import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Clock, TrendingUp, Users, Euro, ExternalLink, User as UserIcon, LogIn, Eye, Languages, Loader2 } from "lucide-react";
import { format } from 'date-fns';

import { getComputedTripStatus, statusColors, difficultyColors } from "../components/helpers/tripHelpers";
import { formatDateRange } from "../components/helpers/dateHelpers";
import { trackEvent } from "../components/analytics/GoogleAnalytics";
import { useLanguage } from "../components/contexts/LanguageContext";
import { useTranslation } from "../components/translations/useTranslations";
// NEW IMPORTS FOR SEO
import StructuredData from "../components/seo/StructuredData";
import { getTripImage, handleImageError } from "../components/helpers/imageHelpers";
import ShareButton from "../components/trip/ShareButton";

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
  
  const urlParams = new URLSearchParams(window.location.search);
  const tripId = urlParams.get("id");

  // Redirect to homepage if no trip ID provided (301 redirect)
  React.useEffect(() => {
    if (!tripId) {
      window.location.replace('/');
    }
  }, [tripId]);

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

  const { data: trip, isLoading: tripLoading } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      const trips = await base44.entities.HikingTrip.filter({ id: tripId });
      return trips[0];
    },
    enabled: !!tripId,
  });

  // Fetch organizer data using organizer_code
  const { data: organizer } = useQuery({
    queryKey: ['trip-organizer', trip?.organizer_code],
    queryFn: async () => {
      const organizers = await base44.entities.Organizer.filter({ organizer_code: trip.organizer_code });
      return organizers[0];
    },
    enabled: !!trip?.organizer_code,
  });

  // Track trip page view when trip data is loaded
  React.useEffect(() => {
    if (trip && organizer) {
      trackEvent('trip_page_view', {
        event_category: 'Trip Content',
        event_label: trip.title,
        trip_id: trip.id,
        organizer_name: organizer.username || organizer.full_name,
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
        
        // Increment view count in database
        const newCount = (trip.view_count || 0) + 1;
        base44.entities.HikingTrip.update(trip.id, { view_count: newCount });
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
      updateMetaTag('og:title', tripTitle, true);
      updateMetaTag('og:description', description, true);
      updateMetaTag('og:image', trip.image_url, true);
      updateMetaTag('og:url', window.location.href, true);
      updateMetaTag('og:type', 'event', true);
      updateMetaTag('twitter:card', 'summary_large_image');
      updateMetaTag('twitter:title', tripTitle);
      updateMetaTag('twitter:description', description);
      updateMetaTag('twitter:image', trip.image_url);
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
      "url": organizer.website || `${window.location.origin}${createPageUrl("OrganizerProfile")}?code=${organizer.organizer_code}`,
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
      "price": trip.price || 0,
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
    "remainingAttendeeCapacity": trip.max_participants,
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

  // Translation state
  const [translatedTrip, setTranslatedTrip] = React.useState(null);
  const [isTranslating, setIsTranslating] = React.useState(false);

  const handleTranslate = async () => {
    if (translatedTrip) {
      setTranslatedTrip(null);
      return;
    }
    setIsTranslating(true);
    const response = await base44.functions.invoke('translateTrip', {
      title: trip?.title,
      description: trip?.description,
      departure_from: trip?.departure_from,
      requirements: trip?.requirements,
    });
    setTranslatedTrip(response.data?.translatedData || response.data);
    setIsTranslating(false);
  };

  if (tripLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <div>
          <h2 className="text-2xl font-bold text-stone-900 mb-2">{t('trip.trip_not_found')}</h2>
          <Link to={createPageUrl("Calendar")}>
            <Button>{t('trip.back_to_calendar')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const computedStatus = getComputedTripStatus(trip);
  const isSocialMedia = isSocialMediaUrl(trip.event_url);

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
        <div className="min-h-screen bg-gradient-to-br from-stone-50 via-emerald-50/30 to-stone-50 p-4 md:p-8">
          <div className="max-w-5xl mx-auto">
            <Button 
              variant="outline" 
              className="mb-6"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {trip.image_url && (
                  <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden shadow-lg">
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

                <Card className="p-6">
                  <h1 className="text-3xl font-bold text-stone-900 mb-2">{trip.title}</h1>

                  {organizer && (
                    <Link
                      to={`${createPageUrl("OrganizerProfile")}?code=${organizer.organizer_code}`}
                      className="inline-flex items-center gap-2 text-stone-600 hover:text-emerald-700 mb-4"
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
                      <MapPin className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="text-sm text-stone-500">Location</p>
                        <p className="font-medium text-stone-900">{trip.location}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="text-sm text-stone-500">Date</p>
                        <p className="font-medium text-stone-900">
                          {formatDateRange(trip.start_date, trip.end_date)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {trip.description && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-stone-900 mb-2">Description</h3>
                      <p className="text-stone-600 whitespace-pre-line line-clamp-4">{trip.description}</p>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                    <LogIn className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-stone-900 mb-2">{t('trip.login_to_see_details')}</h3>
                    <p className="text-stone-600 mb-4">
                      {t('trip.login_message')}
                    </p>
                    <Button 
                      onClick={() => base44.auth.redirectToLogin(window.location.href)}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      {t('trip.login_to_continue')}
                    </Button>
                  </div>
                </Card>
              </div>

              <div>
                <Card className="p-6 sticky top-6">
                  <div className="text-center py-6">
                    <Users className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-stone-900 mb-2">{t('trip.login_required')}</h3>
                    <p className="text-stone-600 mb-4">
                      {t('trip.login_message')}
                    </p>
                    <Button 
                      onClick={() => base44.auth.redirectToLogin(window.location.href)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
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
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-emerald-50/30 to-stone-50 p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <Button 
            variant="outline" 
            className="mb-6"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {trip.image_url && (
                <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden shadow-lg flex items-center justify-center bg-stone-100">
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
                <div className="absolute top-6 right-6 hidden md:flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTranslate}
                    disabled={isTranslating}
                    className="flex items-center gap-1"
                  >
                    {isTranslating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
                    {translatedTrip ? (language === 'el' ? 'Πρωτότυπο' : 'Original') : (language === 'el' ? 'Μετάφραση' : 'Translate')}
                  </Button>
                  <ShareButton trip={trip} language={language} />
                </div>
                
                <h1 className="text-3xl font-bold text-stone-900 mb-2 pr-48">{translatedTrip?.title || trip.title}</h1>

                {organizer && (
                  <Link
                    to={`${createPageUrl("OrganizerProfile")}?code=${organizer.organizer_code}`}
                    className="inline-flex items-center gap-2 text-stone-600 hover:text-emerald-700 mb-4 transition-colors"
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
                    <MapPin className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="text-sm text-stone-500">{t('trip.location')}</p>
                      <p className="font-medium text-stone-900">{trip.location}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="text-sm text-stone-500">{t('trip.date')}</p>
                      <p className="font-medium text-stone-900">
                        {formatDateRange(trip.start_date, trip.end_date)} {trip.start_time && `at ${trip.start_time}`}
                      </p>
                    </div>
                  </div>

                  {trip.duration_hours && (
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="text-sm text-stone-500">{t('trip.duration')}</p>
                        <p className="font-medium text-stone-900">{trip.duration_hours} {t('trip.hours')}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Euro className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="text-sm text-stone-500">{t('trip.price')}</p>
                      <p className="font-medium text-stone-900">
                        {trip.price ? `€${trip.price} ${t('trip.per_person')}` : 'TBA'}
                      </p>
                    </div>
                  </div>

                  {trip.departure_from && trip.departure_from.length > 0 && (
                    <div className="flex items-center gap-3 md:col-start-2">
                      <MapPin className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="text-sm text-stone-500">{language === 'el' ? 'Αναχώρηση Από' : 'Departure From'}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {trip.departure_from.map((location, i) => (
                            <span key={i} className="text-sm font-medium text-stone-900">
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
                    <h3 className="font-semibold text-stone-900 mb-3">{t('trip.meeting_points')}</h3>
                    <div className="space-y-3">
                      {trip.meeting_points.map((point, index) => (
                        <div key={index} className="bg-stone-50 p-3 rounded-lg">
                          <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="font-medium text-stone-900">{point.name}</p>
                              <p className="text-sm text-stone-600 mt-1">{point.location}</p>
                              {point.time && (
                                <div className="flex items-center gap-2 mt-2">
                                  <Clock className="w-4 h-4 text-stone-500" />
                                  <p className="text-sm text-stone-600">{point.time}</p>
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
                    <h3 className="font-semibold text-stone-900 mb-2">{t('trip.description')}</h3>
                    <p className="text-stone-600 whitespace-pre-line break-words overflow-hidden">{translatedTrip?.description || trip.description}</p>
                  </div>
                )}

                {trip.tags && trip.tags.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-stone-900 mb-2">{language === 'el' ? 'Ετικέτες' : 'Tags'}</h3>
                    <div className="flex flex-wrap gap-2">
                      {trip.tags.map((tag, i) => {
                        const isTransportTag = tag === 'bus' || tag === 'organized-carpooling';
                        return (
                          <Badge 
                            key={i} 
                            className={isTransportTag 
                              ? "bg-purple-100 text-purple-800 border-purple-300 border font-semibold" 
                              : "bg-emerald-100 text-emerald-800 border-emerald-200 border"
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
                  <div>
                    <h3 className="font-semibold text-stone-900 mb-2">{t('trip.what_to_bring')}</h3>
                    <ul className="list-disc list-inside space-y-1 text-stone-600">
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
                      className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {t('trip.external_link')}
                    </a>
                  </div>
                )}
              </Card>
            </div>

            <div>
              <Card className="p-6 sticky top-6">
                <div className="text-center py-6">
                  <Users className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-stone-900 mb-2">{t('trip.interested_in_trip')}</h3>
                  <p className="text-stone-600 mb-4">
                    {isSocialMedia 
                      ? t('trip.contact_organizer')
                      : t('trip.click_to_book')
                    }
                  </p>
                  {trip.event_url ? (
                    <Button 
                      asChild
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      onClick={handleBookNowClick}
                    >
                      <a href={trip.event_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {isSocialMedia ? t('trip.contact_organizer') : t('trip.book_now')}
                      </a>
                    </Button>
                  ) : organizer ? ( 
                    <Link to={`${createPageUrl("OrganizerProfile")}?code=${organizer.organizer_code}`}> 
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                        {t('trip.view_organizer_profile')}
                      </Button>
                    </Link>
                  ) : (
                    <p className="text-sm text-stone-500">{t('trip.no_booking_info')}</p>
                  )}
                </div>
              </Card>
            </div>
          </div>
          
          {/* Mobile Share Button - Sticky at bottom */}
          <div className="md:hidden">
            <ShareButton trip={trip} language={language} />
          </div>
        </div>
      </div>
    </>
  );
}