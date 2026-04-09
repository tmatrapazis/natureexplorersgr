import React from "react";

import { useQuery } from "@tanstack/react-query";
import { Organizer, HikingTrip } from "@/api/db";
import { useAuth } from "@/lib/AuthContext";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Globe, User as UserIcon, ShieldCheck, MapPin, Calendar, Loader2, Facebook, Instagram, Twitter, PlusCircle, Edit } from "lucide-react";
import { format } from "date-fns";
import { formatPriceForCard } from "../components/helpers/pricingHelpers";
import { trackEvent } from "../components/analytics/GoogleAnalytics";
import { useLanguage } from "../components/contexts/LanguageContext";
import { useTranslation } from "../components/translations/useTranslations";
import StructuredData from "../components/seo/StructuredData";
import FollowButton from "../components/organizers/FollowButton";
import OptimizedImage from "@/components/ui/OptimizedImage";

export default function OrganizerProfilePage() {
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const { username } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Backward compatibility: support old ?code= format
  const legacyCode = searchParams.get("code");

  const { user } = useAuth();

  const { data: organizer, isLoading: organizerLoading } = useQuery({
    queryKey: ['organizer', username, legacyCode],
    queryFn: async () => {
      if (username) {
        const organizers = await Organizer.filter({ username: username });
        return organizers[0] ?? null;
      } else if (legacyCode) {
        const organizers = await Organizer.filter({ organizer_code: legacyCode });
        return organizers[0] ?? null;
      }
      return null;
    },
    enabled: !!username || !!legacyCode,
  });

  // Upgrade legacy ?code= URL to /organizerprofile/:username once we have the data
  React.useEffect(() => {
    if (legacyCode && !username && organizer?.username) {
      navigate(`/organizerprofile/${organizer.username}`, { replace: true });
    }
  }, [legacyCode, username, organizer?.username, navigate]);

  const { data: allTrips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ['organizer-trips', organizer?.organizer_code],
    queryFn: () => HikingTrip.filter({ organizer_code: organizer.organizer_code }, "start_date"),
    enabled: !!organizer?.organizer_code,
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
        is_verified: organizer.verified,
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
      const canonicalUrl = `https://natureexplorers.gr/organizerprofile/${organizer.username}`;

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
      updateMetaTag('og:image', organizer.profile_picture_url || 'https://ihrvqyglwxqkczfsntur.supabase.co/storage/v1/object/sign/app_photos/Nature%20Explorers%20logo%20Green.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9hNmI0OGRkOS0zZWY1LTQ1YzktYjI2MC1jZmYyZGQ2YjU4N2IiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcHBfcGhvdG9zL05hdHVyZSBFeHBsb3JlcnMgbG9nbyBHcmVlbi5wbmciLCJpYXQiOjE3NzU3NjAwODAsImV4cCI6MTkzMzQ0MDA4MH0.ke7Ht1D_CTQALVRCaVCWsXgcLwrVhMKMmf2ymZ2Sd7A', true);
      updateMetaTag('og:url', canonicalUrl, true);  // stable canonical, not window.location.href
      updateMetaTag('og:type', 'profile', true);
      updateMetaTag('og:site_name', 'Nature Explorers', true);
      updateMetaTag('twitter:card', 'summary_large_image');
      updateMetaTag('twitter:title', pageTitle);
      updateMetaTag('twitter:description', description);
      updateMetaTag('twitter:image', organizer.profile_picture_url || 'https://ihrvqyglwxqkczfsntur.supabase.co/storage/v1/object/sign/app_photos/Nature%20Explorers%20logo%20Green.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9hNmI0OGRkOS0zZWY1LTQ1YzktYjI2MC1jZmYyZGQ2YjU4N2IiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcHBfcGhvdG9zL05hdHVyZSBFeHBsb3JlcnMgbG9nbyBHcmVlbi5wbmciLCJpYXQiOjE3NzU3NjAwODAsImV4cCI6MTkzMzQ0MDA4MH0.ke7Ht1D_CTQALVRCaVCWsXgcLwrVhMKMmf2ymZ2Sd7A');

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
  const canonicalUrl = organizer ? `https://natureexplorers.gr/organizerprofile/${organizer.username}` : null;

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
            "url": `https://natureexplorers.gr/tripdetails?id=${trip.id}`,
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
      { "@type": "ListItem", "position": 2, "name": "Organizers", "item": "https://natureexplorers.gr/organizerslist" },
      { "@type": "ListItem", "position": 3, "name": organizer.full_name, "item": canonicalUrl }
    ]
  } : null;

  const isLoading = organizerLoading || tripsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-brand-dark" />
      </div>
    );
  }

  if (!organizer) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">{t('trip.organizer')} {t('errors.not_found')}</h2>
          <Link to={createPageUrl("OrganizersList")} aria-label={t('common.back_to_organizers')}>
            <Button className="min-h-[44px]" tabIndex={-1}>{t('common.back_to_organizers')}</Button>
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
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-brand-gold/30 to-stone-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Organizer Header */}
          <div className="bg-card rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1" />
              {/* Hide the Follow button when the organizer is viewing their own profile */}
              {user?.organizer_code !== organizer?.organizer_code && (
                <FollowButton organizer={organizer} variant="default" showCount={true} />
              )}
            </div>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-muted flex-shrink-0 flex items-center justify-center shadow-lg overflow-hidden">
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
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground">{organizer.full_name}</h1>
                  {organizer.verified && (
                    <Badge className="bg-brand-gold/40 text-brand-dark border-brand-dark/20 self-center md:self-start">
                      <ShieldCheck className="w-4 h-4 mr-1" />
                      {t('common.verified')}
                    </Badge>
                  )}
                </div>
                
                {organizer.bio && <p className="text-muted-foreground mt-2 max-w-2xl">{organizer.bio}</p>}
                
                {organizer.years_of_experience && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {organizer.years_of_experience} {t('organizer.years_of_experience')}
                  </p>
                )}
                
                {organizer.certifications && (
                  <p className="text-sm text-muted-foreground mt-1">
                    <strong>{t('organizer.certifications')}:</strong> {organizer.certifications}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm text-muted-foreground justify-center md:justify-start">
                  <a href={`mailto:${organizer.email}`} className="flex items-center gap-2 hover:text-brand-dark min-h-[44px]" aria-label={`Email ${organizer.full_name}: ${organizer.email}`}>
                    <Mail className="w-4 h-4" aria-hidden="true" />
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
                      className="flex items-center gap-2 hover:text-brand-dark min-h-[44px]"
                      aria-label={`${language === 'el' ? 'Ιστοσελίδα' : 'Website'}: ${organizer.website.replace(/https?:\/\//, '')}`}
                    >
                      <Globe className="w-4 h-4" aria-hidden="true" />
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
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors min-h-[44px]"
                        aria-label={`${organizer.full_name} on Facebook`}
                      >
                        <Facebook className="w-4 h-4" aria-hidden="true" />
                        <span className="text-sm font-medium">{t('social.facebook')}</span>
                      </a>
                    )}
                    {organizer.social_profiles.instagram && (
                      <a
                        href={organizer.social_profiles.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-colors min-h-[44px]"
                        aria-label={`${organizer.full_name} on Instagram`}
                      >
                        <Instagram className="w-4 h-4" aria-hidden="true" />
                        <span className="text-sm font-medium">{t('social.instagram')}</span>
                      </a>
                    )}
                    {organizer.social_profiles.twitter && (
                      <a
                        href={organizer.social_profiles.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors min-h-[44px]"
                        aria-label={`${organizer.full_name} on X (Twitter)`}
                      >
                        <Twitter className="w-4 h-4" aria-hidden="true" />
                        <span className="text-sm font-medium">{t('social.twitter_x')}</span>
                      </a>
                    )}
                  </div>
                )}

                {/* Organizer Actions - Only visible to the organizer themselves */}
                {user?.organizer_code === organizer?.organizer_code && (
                  <div className="mt-4 justify-center md:justify-start flex gap-2 flex-wrap">
                    <Link to={createPageUrl("MyTrips")} aria-label={language === 'el' ? 'Οι Εκδρομές μου' : 'My Trips'}>
                      <Button variant="outline" className="min-h-[44px]" tabIndex={-1}>
                        <Calendar className="w-4 h-4 mr-2" aria-hidden="true" />
                        {language === 'el' ? 'Οι Εκδρομές μου' : 'My Trips'}
                      </Button>
                    </Link>
                    <Link to={createPageUrl("EditOrganizerProfile")} aria-label={language === 'el' ? 'Επεξεργασία Προφίλ' : 'Edit organizer profile'}>
                      <Button variant="outline" className="min-h-[44px]" tabIndex={-1}>
                        <Edit className="w-4 h-4 mr-2" aria-hidden="true" />
                        {language === 'el' ? 'Επεξεργασία Προφίλ' : 'Edit Profile'}
                      </Button>
                    </Link>
                    <Link to={createPageUrl("TripForm")} aria-label={language === 'el' ? 'Δημιουργία Νέας Εκδρομής' : 'Create new trip'}>
                      <Button className="bg-brand-dark hover:bg-brand-dark/90 min-h-[44px]" tabIndex={-1}>
                        <PlusCircle className="w-4 h-4 mr-2" aria-hidden="true" />
                        {language === 'el' ? 'Δημιουργία Νέας Εκδρομής' : 'Create New Trip'}
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Upcoming Trips List */}
          <div className="bg-card rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              {t('organizer.upcoming_trips')} ({trips.length})
            </h2>
            
            {trips.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" aria-hidden="true" />
                <h3 className="text-lg font-semibold text-foreground mb-2">{t('organizer.no_upcoming_trips')}</h3>
                <p className="text-muted-foreground">{t('organizer.check_back_later_for_adventures')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {trips.map((trip) => {
                  const formattedDate = format(new Date(trip.start_date), "MMM d, yyyy");
                  const price = formatPriceForCard(trip, language);
                  return (
                  <div key={trip.id} style={{ contentVisibility: 'auto', containIntrinsicSize: '0 340px' }}>
                    <Link
                      to={`${createPageUrl("TripDetails")}?id=${trip.id}`}
                      onClick={() => handleTripViewDetailsClick(trip)}
                      aria-label={`${t('trip.view_details')}: ${trip.title}`}
                      className="block"
                    >
                      <div className="relative rounded-xl overflow-hidden group cursor-pointer aspect-[4/3] shadow-md hover:shadow-xl transition-shadow duration-300">
                        {/* Full-bleed photo */}
                        <OptimizedImage
                          src={trip.image_url || `https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800&q=75&fm=webp`}
                          alt={language === 'el'
                            ? `${trip.title} - πεζοπορική εκδρομή ${trip.location} Ελλάδα outdoor trekking`
                            : `${trip.title} - ${trip.location} hiking trekking expedition Greece outdoor adventure`}
                          width={800}
                          height={600}
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {/* Deep Forest gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/50 to-transparent" />
                        {/* Content anchored to bottom */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                          {/* Badges */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {trip.difficulty && (
                              <span className="bg-brand-gold-accent text-brand-gold text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide" style={{ fontFamily: 'var(--font-heading)' }}>
                                {trip.difficulty}
                              </span>
                            )}
                            {trip.status === 'almost soldout' && (
                              <span className="bg-orange-500 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                {language === 'el' ? 'Σχεδόν γεμάτο' : 'Almost Full'}
                              </span>
                            )}
                          </div>
                          {/* Title */}
                          <h3 className="font-bold text-brand-gold text-lg leading-tight line-clamp-2" style={{ fontFamily: 'var(--font-heading)' }}>
                            {trip.title}
                          </h3>
                          {/* Date + Price */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-brand-gold/80 text-sm">
                              <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>{formattedDate}</span>
                            </div>
                            <span className="font-bold text-brand-gold-accent text-base" style={{ fontFamily: 'var(--font-heading)' }}>
                              {price}
                            </span>
                          </div>
                          {/* Location */}
                          {trip.location && (
                            <div className="flex items-center gap-1.5 text-brand-gold/60 text-xs">
                              <MapPin className="w-3 h-3" aria-hidden="true" />
                              <span className="line-clamp-1">{trip.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}