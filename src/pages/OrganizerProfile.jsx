import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Phone, Globe, User as UserIcon, ShieldCheck, MapPin, Calendar, Clock, TrendingUp, ExternalLink, Loader2, Facebook, Instagram, Twitter, PlusCircle, Edit } from "lucide-react";
import { format } from "date-fns";
import { formatDateRange } from "../components/helpers/dateHelpers";
import { difficultyColors } from "../components/helpers/tripHelpers";
import { formatPriceForCard } from "../components/helpers/pricingHelpers";
import { trackEvent } from "../components/analytics/GoogleAnalytics";
import { useLanguage } from "../components/contexts/LanguageContext";
import { useTranslation } from "../components/translations/useTranslations";
import StructuredData from "../components/seo/StructuredData";
import FollowButton from "../components/organizers/FollowButton";

export default function OrganizerProfilePage() {
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const { username } = useParams();
  const navigate = useNavigate();
  
  // Backward compatibility: support old ?code= format
  const urlParams = new URLSearchParams(window.location.search);
  const legacyCode = urlParams.get("code");

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

  const { data: organizer, isLoading: organizerLoading } = useQuery({
    queryKey: ['organizer', username, legacyCode],
    queryFn: async () => {
      if (username) {
        const organizers = await base44.entities.Organizer.filter({ username: username });
        return organizers[0];
      } else if (legacyCode) {
        const organizers = await base44.entities.Organizer.filter({ organizer_code: legacyCode });
        const org = organizers[0];
        // Redirect to new URL format
        if (org?.username) {
          navigate(`/OrganizerProfile/${org.username}`, { replace: true });
        }
        return org;
      }
      return null;
    },
    enabled: !!username || !!legacyCode,
  });

  const { data: allTrips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ['organizer-trips', organizer?.organizer_code],
    queryFn: () => base44.entities.HikingTrip.filter({ organizer_code: organizer.organizer_code }, "start_date"),
    enabled: !!organizer?.organizer_code,
    initialData: [],
  });

  // Filter trips to only show future events with upcoming or almost soldout status
  const trips = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    return allTrips.filter(trip => {
      const tripStartDate = new Date(trip.start_date);
      const isUpcoming = trip.status === 'upcoming' || trip.status === 'almost soldout';
      return tripStartDate >= today && isUpcoming;
    });
  }, [allTrips]);
  
  // Track organizer profile view
  React.useEffect(() => {
    if (organizer) {
      trackEvent('organizer_profile_view', {
        event_category: 'Organizer Discovery',
        event_label: organizer.full_name,
        organizer_code: organizer.organizer_code,
        is_verified: organizer.is_verified,
        upcoming_trips_count: trips.length,
      });
    }
  }, [organizer, trips.length]);

  // Handler for trip "View Details" clicks from organizer profile
  const handleTripViewDetailsClick = (trip) => {
    if (organizer) { // Ensure organizer data is available before tracking
      trackEvent('view_details_click', {
        event_category: 'Trip Discovery',
        event_label: trip.title,
        trip_id: trip.id,
        organizer_name: organizer.full_name,
        difficulty: trip.difficulty,
        price: trip.price,
        source: 'organizer_profile',
      });
    }
  };

  // SEO Configuration with keywords and canonical URL
  React.useEffect(() => {
    if (organizer) {
      // Stable canonical URL using slug — consistent across all tags
      const canonicalUrl = `https://natureexplorers.gr/OrganizerProfile/${organizer.username}`;

      // Title includes username/slug for brand keyword indexing
      const pageTitle = language === 'el'
        ? `${organizer.full_name} (@${organizer.username}) | Οδηγός Πεζοπορίας Ελλάδα | Nature Explorers`
        : `${organizer.full_name} (@${organizer.username}) - Hiking Organizer Greece | Nature Explorers`;

      document.title = pageTitle;

      // Canonical tag
      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute('href', canonicalUrl);

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

      const description = organizer.bio
        ? organizer.bio.substring(0, 155)
        : language === 'el'
          ? `Ανακαλύψτε πεζοπορικές εκδρομές από τον ${organizer.full_name}. ${organizer.years_of_experience ? `${organizer.years_of_experience} χρόνια εμπειρίας.` : ''} Οργανωμένες εκδρομές βουνό, outdoor περιπέτειες ορειβασίας και trekking στην Ελλάδα. Ομάδες πεζοπορίας και hiking tours Greece.`
          : `Explore hiking trips organized by ${organizer.full_name}. ${organizer.years_of_experience ? `${organizer.years_of_experience} years experience.` : ''} Join their trekking adventures, hiking teams Greece, outdoor activities and weekend hiking trips.`;

      updateMetaTag('description', description);
      updateMetaTag('keywords', language === 'el'
        ? `οδηγός πεζοπορίας, ${organizer.full_name}, ${organizer.username}, εκδρομές, ορειβασία, trekking, outdoor activities, hiking greece, ομάδες πεζοπορίας, οργανωμένες εκδρομές βουνού, hiking teams greece`
        : `hiking guide, ${organizer.full_name}, ${organizer.username}, trekking, outdoor activities, mountain guide, hiking greece, hiking teams greece, hiking tours greece, weekend hiking trips`);
      updateMetaTag('og:title', pageTitle, true);
      updateMetaTag('og:description', description, true);
      updateMetaTag('og:image', organizer.profile_picture_url || 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68edfeced35e3590d79eccb8/01040e5a0_logo.png', true);
      updateMetaTag('og:url', canonicalUrl, true);  // stable canonical, not window.location.href
      updateMetaTag('og:type', 'profile', true);
      updateMetaTag('og:site_name', 'Nature Explorers', true);
      updateMetaTag('twitter:card', 'summary_large_image');
      updateMetaTag('twitter:title', pageTitle);
      updateMetaTag('twitter:description', description);
      updateMetaTag('twitter:image', organizer.profile_picture_url || 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68edfeced35e3590d79eccb8/01040e5a0_logo.png');

      // hreflang self-referencing — use canonical URL, not window.location.href
      const addHreflang = (lang, href) => {
        let el = document.querySelector(`link[hreflang="${lang}"]`);
        if (!el) {
          el = document.createElement('link');
          el.setAttribute('rel', 'alternate');
          el.setAttribute('hreflang', lang);
          document.head.appendChild(el);
        }
        el.setAttribute('href', href);
      };
      addHreflang('el', canonicalUrl);
      addHreflang('en', canonicalUrl);
      addHreflang('x-default', canonicalUrl);
    }
  }, [organizer, language]);

  // Enhanced Structured Data for Organizer
  const canonicalUrl = organizer ? `https://natureexplorers.gr/OrganizerProfile/${organizer.username}` : null;

  const organizerSchema = organizer ? {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "Organization"],  // LocalBusiness unlocks richer Knowledge Panel & local search
    "@id": canonicalUrl,
    "name": organizer.full_name,
    "description": organizer.bio || (language === 'el'
      ? `Επαγγελματίας οδηγός πεζοπορίας, ορειβασίας και trekking στην Ελλάδα. Οργανωμένες εκδρομές βουνό, outdoor activities και hiking tours Greece με ομάδες πεζοπορίας.`
      : `Professional hiking guide, trekking organizer and outdoor activities leader in Greece. Organized hiking trips, mountain trekking tours and weekend hiking adventures with hiking teams Greece.`),
    "url": canonicalUrl,
    "image": organizer.profile_picture_url,
    "email": organizer.email,
    "telephone": organizer.phone,
    "sameAs": [
      organizer.social_profiles?.facebook,
      organizer.social_profiles?.instagram,
      organizer.social_profiles?.twitter,
      organizer.website
    ].filter(Boolean),
    ...(organizer.years_of_experience && {
      "knowsAbout": language === 'el'
        ? ["Πεζοπορία", "Ορειβασία", "Trekking", "Outdoor Activities", "Mountain Expeditions", "Εκδρομές Βουνό", "Hiking Tours Greece"]
        : ["Hiking", "Mountain Trekking", "Outdoor Adventure", "Nature Exploration", "Wilderness Guiding", "Hiking Trips Greece", "Weekend Hiking"],
      "foundingDate": organizer.years_of_experience
        ? String(new Date().getFullYear() - organizer.years_of_experience)
        : undefined
    }),
    "areaServed": {
      "@type": "Country",
      "name": "Greece",
      "alternateName": "Ελλάδα"
    },
    // hasOfferCatalog: lets Google associate upcoming trips with this organizer in search
    ...(trips.length > 0 && {
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": language === 'el' ? `Εκδρομές από ${organizer.full_name}` : `Trips by ${organizer.full_name}`,
        "itemListElement": trips.slice(0, 5).map((trip, i) => ({
          "@type": "Offer",
          "position": i + 1,
          "itemOffered": {
            "@type": "Event",
            "name": trip.title,
            "url": `https://natureexplorers.gr/TripDetails?id=${trip.id}`,
            "startDate": trip.start_date,
            "location": {
              "@type": "Place",
              "name": trip.location,
              "address": { "@type": "PostalAddress", "addressCountry": "GR" }
            }
          }
        }))
      }
    })
  } : null;

  // BreadcrumbList Structured Data — use canonical URL for last item
  const breadcrumbSchema = organizer ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://natureexplorers.gr/" },
      { "@type": "ListItem", "position": 2, "name": "Organizers", "item": "https://natureexplorers.gr/OrganizersList" },
      { "@type": "ListItem", "position": 3, "name": organizer.full_name, "item": canonicalUrl }
    ]
  } : null;

  const isLoading = organizerLoading || tripsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!organizer) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <div>
          <h2 className="text-2xl font-bold text-stone-900 mb-2">{t('trip.organizer')} {t('errors.not_found')}</h2>
          <Link to={createPageUrl("OrganizersList")}>
            <Button>{t('common.back_to_organizers')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Check if organizer has any social profiles
  const hasSocialProfiles = organizer.social_profiles && (
    organizer.social_profiles.facebook || 
    organizer.social_profiles.instagram || 
    organizer.social_profiles.twitter
  );

  return (
    <>
      {organizerSchema && <StructuredData data={organizerSchema} />}
      {breadcrumbSchema && <StructuredData data={breadcrumbSchema} />}
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-emerald-50/30 to-stone-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Organizer Header */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1" />
              <FollowButton organizer={organizer} variant="default" showCount={true} />
            </div>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white flex-shrink-0 flex items-center justify-center shadow-lg overflow-hidden">
                {organizer.profile_picture_url ? (
                  <img 
                    src={organizer.profile_picture_url} 
                    alt={language === 'el'
                      ? `${organizer.full_name} - οδηγός πεζοπορίας και ορειβασίας Ελλάδα`
                      : `${organizer.full_name} - professional hiking and trekking guide Greece`}
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <UserIcon className="w-16 h-16 text-white" aria-hidden="true" />
                )}
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                  <h1 className="text-3xl md:text-4xl font-bold text-stone-900">{organizer.full_name}</h1>
                  {organizer.is_verified && (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 self-center md:self-start">
                      <ShieldCheck className="w-4 h-4 mr-1" />
                      {t('common.verified')}
                    </Badge>
                  )}
                </div>
                
                {organizer.bio && <p className="text-stone-600 mt-2 max-w-2xl">{organizer.bio}</p>}
                
                {organizer.years_of_experience && (
                  <p className="text-sm text-stone-500 mt-2">
                    {organizer.years_of_experience} {t('organizer.years_of_experience')}
                  </p>
                )}
                
                {organizer.certifications && (
                  <p className="text-sm text-stone-600 mt-1">
                    <strong>{t('organizer.certifications')}:</strong> {organizer.certifications}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm text-stone-600 justify-center md:justify-start">
                  <a href={`mailto:${organizer.email}`} className="flex items-center gap-2 hover:text-emerald-600">
                    <Mail className="w-4 h-4" />
                    {organizer.email}
                  </a>
                  {organizer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {organizer.phone}
                    </div>
                  )}
                  {organizer.website && (
                    <a 
                      href={organizer.website.startsWith('http://') || organizer.website.startsWith('https://') ? organizer.website : `https://${organizer.website}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-2 hover:text-emerald-600"
                    >
                      <Globe className="w-4 h-4" />
                      {organizer.website.replace(/https?:\/\//, '')}
                    </a>
                  )}
                </div>

                {/* Social Media Buttons */}
                {hasSocialProfiles && (
                  <div className="flex flex-wrap gap-3 mt-4 justify-center md:justify-start">
                    {organizer.social_profiles.facebook && (
                      <a
                        href={organizer.social_profiles.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        <Facebook className="w-4 h-4" />
                        <span className="text-sm font-medium">{t('social.facebook')}</span>
                      </a>
                    )}
                    {organizer.social_profiles.instagram && (
                      <a
                        href={organizer.social_profiles.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-colors"
                      >
                        <Instagram className="w-4 h-4" />
                        <span className="text-sm font-medium">{t('social.instagram')}</span>
                      </a>
                    )}
                    {organizer.social_profiles.twitter && (
                      <a
                        href={organizer.social_profiles.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors"
                      >
                        <Twitter className="w-4 h-4" />
                        <span className="text-sm font-medium">{t('social.twitter_x')}</span>
                      </a>
                    )}
                  </div>
                )}

                {/* Organizer Actions - Only visible to the organizer themselves */}
                {user?.organizer_code === organizer?.organizer_code && (
                  <div className="mt-4 justify-center md:justify-start flex gap-2 flex-wrap">
                    <Link to={createPageUrl("MyTrips")}>
                      <Button variant="outline">
                        <Calendar className="w-4 h-4 mr-2" />
                        {language === 'el' ? 'Οι Εκδρομές μου' : 'My Trips'}
                      </Button>
                    </Link>
                    <Link to={createPageUrl("EditOrganizerProfile")}>
                      <Button variant="outline">
                        <Edit className="w-4 h-4 mr-2" />
                        {language === 'el' ? 'Επεξεργασία Προφίλ' : 'Edit Profile'}
                      </Button>
                    </Link>
                    <Link to={createPageUrl("CreateTrip")}>
                      <Button className="bg-emerald-600 hover:bg-emerald-700">
                        <PlusCircle className="w-4 h-4 mr-2" />
                        {language === 'el' ? 'Δημιουργία Νέας Εκδρομής' : 'Create New Trip'}
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Upcoming Trips List */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-stone-900 mb-6">
              {t('organizer.upcoming_trips')} ({trips.length})
            </h2>
            
            {trips.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 mx-auto text-stone-300 mb-4" aria-hidden="true" />
                <h3 className="text-lg font-semibold text-stone-700 mb-2">{t('organizer.no_upcoming_trips')}</h3>
                <p className="text-stone-500">{t('organizer.check_back_later_for_adventures')}</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trips.map((trip) => (
                  <Card key={trip.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
                    <Link 
                      to={`${createPageUrl("TripDetails")}?id=${trip.id}`}
                      onClick={() => handleTripViewDetailsClick(trip)}
                      className="flex flex-col h-full"
                    >
                      {trip.image_url && (
                        <div className="w-full h-48 bg-stone-200">
                          <img 
                            src={trip.image_url} 
                            alt={language === 'el'
                              ? `${trip.title} - πεζοπορική εκδρομή ${trip.location} Ελλάδα outdoor trekking`
                              : `${trip.title} - ${trip.location} hiking trekking expedition Greece outdoor adventure`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <CardContent className="p-4 flex flex-col flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-bold text-stone-900 line-clamp-2 flex-1">
                            {trip.title}
                          </h3>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge className={`${difficultyColors[trip.difficulty]} border text-xs`}>
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {trip.difficulty}
                          </Badge>
                          <Badge variant="outline" className="text-xs text-emerald-700">
                            {formatPriceForCard(trip, language)}
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
                          {trip.tags && trip.tags.includes('bus') && (
                            <Badge className="bg-purple-100 text-purple-800 border-purple-300 border text-xs font-semibold">
                              🚌 bus
                            </Badge>
                          )}
                          {trip.tags && trip.tags.includes('organized-carpooling') && (
                            <Badge className="bg-purple-100 text-purple-800 border-purple-300 border text-xs font-semibold">
                              🚗 carpooling
                            </Badge>
                          )}
                        </div>
                        {trip.departure_from && trip.departure_from.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {trip.departure_from.map((location, idx) => (
                              <Badge key={idx} variant="outline" className="border-blue-300 text-blue-700 text-xs">
                                📍 {location}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="space-y-2 text-sm text-stone-600 mb-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <span>{formatDateRange(trip.start_date, trip.end_date)}</span>
                          </div>
                          
                          {trip.start_time && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                              <span>{trip.start_time} • {trip.duration_hours}{t('common.duration_unit_hours_short')}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <span className="line-clamp-1">{trip.location}</span>
                          </div>
                        </div>



                        <div className="flex gap-2 mt-auto">
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 flex-1">
                            {t('trip.view_details')}
                          </Button>
                          {user && trip.external_link && (
                            <button
                              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground h-8"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(trip.external_link, '_blank', 'noopener,noreferrer'); }}
                            >
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}