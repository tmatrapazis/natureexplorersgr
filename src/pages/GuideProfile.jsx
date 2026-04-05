import React from "react";

import { useQuery } from "@tanstack/react-query";
import { MountainGuide, Organizer, HikingTrip } from "@/api/db";
import { useAuth } from "@/lib/AuthContext";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import DOMPurify from "dompurify";
import { useBackNavigation } from '../lib/useBackNavigation';
import { useLanguage } from "../components/contexts/LanguageContext";
import { useTranslation } from "../components/translations/useTranslations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Shield, Award, Briefcase, Instagram, Facebook, MapPin, Calendar, TrendingUp, Edit, Trash2 } from "lucide-react";
import { formatDateRange } from "../components/helpers/dateHelpers";
import ShareGuideButton from "../components/guides/ShareGuideButton";
import { difficultyColors } from "../components/helpers/tripHelpers";
import { getTripImage, handleImageError } from "../components/helpers/imageHelpers";
import StructuredData from "../components/seo/StructuredData";

export default function GuideProfilePage() {
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const navigate = useNavigate();
  const { goBack } = useBackNavigation(createPageUrl("Guides"));
  
  const [searchParams] = useSearchParams();
  // Freeze at mount time — prevents redirect firing during AnimatePresence
  // exit animation when the URL has already changed to the next page.
  const guideId = React.useRef(searchParams.get("id")).current;

  // Redirect to Guides page if no guide ID provided
  React.useEffect(() => {
    if (!guideId) {
      navigate(createPageUrl("Guides"), { replace: true });
    }
  }, [guideId, navigate]);

  const { user: currentUser } = useAuth();

  const { data: guide, isLoading: guideLoading } = useQuery({
    queryKey: ['guide', guideId],
    queryFn: async () => {
      const guides = await MountainGuide.filter({ id: guideId });
      return guides[0];
    },
    enabled: !!guideId,
  });

  const { data: organizers = [] } = useQuery({
    queryKey: ['guide-organizers', guide?.organizer_codes],
    queryFn: async () => {
      if (!guide?.organizer_codes?.length) return [];
      const allOrganizers = await Organizer.list();
      return allOrganizers.filter(org => guide.organizer_codes.includes(org.organizer_code));
    },
    enabled: !!guide?.organizer_codes,
  });

  const { data: upcomingTrips = [] } = useQuery({
    queryKey: ['guide-trips', guideId],
    queryFn: async () => {
      const allTrips = await HikingTrip.filter({ guide_id: guideId });
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return allTrips.filter(trip => {
        const tripDate = new Date(trip.start_date);
        return tripDate >= today && trip.status !== 'cancelled' && trip.status !== 'draft';
      }).sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    },
    enabled: !!guideId,
  });

  // SEO Configuration with canonical URL and meta tags
  React.useEffect(() => {
    if (guide) {
      // Dynamic page title
      const pageTitle = language === 'el'
        ? `${guide.full_name} - Πιστοποιημένος Οδηγός Βουνού | Nature Explorers`
        : `${guide.full_name} - Certified Mountain Guide | Nature Explorers`;
      
      document.title = pageTitle;

      // Add self-referencing canonical tag
      const canonicalUrl = window.location.href;
      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute('href', canonicalUrl);

      // Dynamic meta description from bio
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

      // Extract text from bio HTML and create description
      const bioText = guide.bio ? guide.bio.replace(/<[^>]*>/g, '').substring(0, 150) : '';
      const description = bioText 
        ? `${bioText}${bioText.length === 150 ? '...' : ''}`
        : language === 'el'
          ? `Γνωρίστε τον ${guide.full_name}, έμπειρο οδηγό βουνού στη Nature Explorers. ${guide.years_of_experience ? `${guide.years_of_experience} χρόνια εμπειρίας.` : ''} Δείτε το προφίλ και τις επερχόμενες εκδρομές.`
          : `Meet ${guide.full_name}, an experienced mountain guide at Nature Explorers. ${guide.years_of_experience ? `${guide.years_of_experience} years of experience.` : ''} View their profile and upcoming trips.`;

      updateMetaTag('description', description);
      updateMetaTag('og:title', pageTitle, true);
      updateMetaTag('og:description', description, true);
      updateMetaTag('og:image', guide.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(guide.full_name)}&size=400&background=10b981&color=fff`, true);
      updateMetaTag('og:url', canonicalUrl, true);
      updateMetaTag('og:type', 'profile', true);
    }
  }, [guide, language]);

  const isOwner = currentUser && guide && guide.user_id === currentUser.id;

  // Structured Data for Person/ProfilePage
  const guideSchema = guide ? {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": guide.full_name,
    "description": guide.bio ? guide.bio.replace(/<[^>]*>/g, '').substring(0, 200) : (language === 'el'
      ? `Επαγγελματίας οδηγός βουνού και πεζοπορίας στην Ελλάδα με εξειδίκευση σε ορειβατικές εκδρομές και trekking.`
      : `Professional mountain and hiking guide in Greece specializing in trekking expeditions and outdoor adventures.`),
    "image": guide.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(guide.full_name)}&size=400&background=10b981&color=fff`,
    "url": window.location.href,
    "jobTitle": language === 'el' ? "Οδηγός Βουνού" : "Mountain Guide",
    "worksFor": {
      "@type": "Organization",
      "name": "Nature Explorers"
    },
    ...(guide.years_of_experience && {
      "knowsAbout": language === 'el'
        ? ["Πεζοπορία", "Ορειβασία", "Trekking", "Outdoor Activities", "Mountain Safety"]
        : ["Hiking", "Mountain Trekking", "Outdoor Adventure", "Nature Exploration", "Mountain Safety"]
    }),
    ...(guide.social_media?.instagram && { "sameAs": [guide.social_media.instagram, guide.social_media.facebook].filter(Boolean) }),
    ...(guide.certifications && guide.certifications.length > 0 && {
      "hasCredential": guide.certifications.map(cert => ({
        "@type": "EducationalOccupationalCredential",
        "name": cert
      }))
    })
  } : null;

  if (guideLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {language === 'el' ? 'Ο οδηγός δεν βρέθηκε' : 'Guide not found'}
          </h2>
          <Link to={createPageUrl("Guides")} aria-label={language === 'el' ? 'Επιστροφή στους Οδηγούς' : 'Back to Guides'}>
            <Button className="min-h-[44px]" tabIndex={-1}>
              {language === 'el' ? 'Επιστροφή στους Οδηγούς' : 'Back to Guides'}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {guideSchema && <StructuredData data={guideSchema} />}
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-emerald-50/30 to-stone-50">
      {/* Hero Section with Cover Photo */}
      <div className="relative h-64 md:h-96 bg-gradient-to-r from-emerald-700 to-emerald-900">
        {guide.cover_photo_url && (
          <img
            src={guide.cover_photo_url}
            alt=""
            className="w-full h-full object-cover opacity-40"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Back Button - Upper Left Corner (desktop only; mobile header handles back) */}
        <div className="absolute top-4 left-4 z-20 hidden md:block">
          <Button
            variant="outline"
            className="bg-background min-h-[44px]"
            onClick={() => navigate(createPageUrl("Guides"))}
            aria-label={language === 'el' ? 'Πίσω στους Οδηγούς' : 'Back to Guides'}
          >
            <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
            {language === 'el' ? 'Πίσω στους Οδηγούς' : 'Back to Guides'}
          </Button>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 -mt-24 relative z-10">
        {isOwner && (
          <div className="flex justify-end gap-3 mb-4">
            <ShareGuideButton guide={guide} language={language} />
            <Button
              onClick={() => navigate(createPageUrl('EditGuideProfile') + `?id=${guideId}`)}
              className="bg-[#0c281c] hover:bg-[#0c281c]/90 min-h-[44px]"
              aria-label={language === 'el' ? 'Επεξεργασία προφίλ οδηγού' : 'Edit guide profile'}
            >
              <Edit className="w-4 h-4 mr-2" aria-hidden="true" />
              {language === 'el' ? 'Επεξεργασία' : 'Edit Profile'}
            </Button>
          </div>
        )}

        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <img
                src={guide.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(guide.full_name)}&size=400&background=10b981&color=fff`}
                alt={guide.full_name}
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl -mt-20"
              />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-foreground">{guide.full_name}</h1>
                  {guide.is_verified && (
                    <Badge className="bg-[#0c281c] text-white flex items-center gap-1">
                      <Shield className="w-4 h-4" />
                      {language === 'el' ? 'Πιστοποιημένος Οδηγός' : 'Verified Guide'}
                    </Badge>
                  )}
                </div>
                
                {guide.years_of_experience && (
                  <p className="text-lg text-muted-foreground mb-4">
                    {guide.years_of_experience} {language === 'el' ? 'χρόνια εμπειρίας' : 'years of experience'}
                  </p>
                )}

                {(guide.social_media?.instagram || guide.social_media?.facebook) && (
                  <div className="flex gap-3">
                    {guide.social_media.instagram && (
                      <a
                        href={guide.social_media.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-[#0c281c] transition-colors inline-flex items-center justify-center min-h-[44px] min-w-[44px]"
                        aria-label={`${guide.full_name} on Instagram`}
                      >
                        <Instagram className="w-5 h-5" aria-hidden="true" />
                      </a>
                    )}
                    {guide.social_media.facebook && (
                      <a
                        href={guide.social_media.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-[#0c281c] transition-colors inline-flex items-center justify-center min-h-[44px] min-w-[44px]"
                        aria-label={`${guide.full_name} on Facebook`}
                      >
                        <Facebook className="w-5 h-5" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* About Section */}
            {guide.bio && (
              <Card>
                <CardHeader>
                  <CardTitle>{language === 'el' ? 'Σχετικά με εμένα' : 'About Me'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-foreground prose prose-inherit max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(guide.bio) }} />
                </CardContent>
              </Card>
            )}

            {/* Certifications Section */}
            {guide.certifications && guide.certifications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-[#0c281c]" />
                    {language === 'el' ? 'Πιστοποιήσεις' : 'Certifications'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {guide.certifications.map((cert, index) => (
                      <Badge key={index} variant="outline" className="text-base px-4 py-2">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Adventures */}
            {upcomingTrips.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#0c281c]" />
                    {language === 'el' ? 'Επερχόμενες Εκδρομές' : 'Upcoming Adventures'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {upcomingTrips.map(trip => (
                      <Link
                        key={trip.id}
                        to={`${createPageUrl("TripDetails")}?id=${trip.id}`}
                        className="block"
                        aria-label={`${language === 'el' ? 'Προβολή εκδρομής' : 'View trip'}: ${trip.title}`}
                      >
                        <div className="flex gap-4 p-4 rounded-lg border hover:border-emerald-600 hover:shadow-md transition-all">
                          <img
                            src={getTripImage(trip.image_url, trip.id)}
                            alt={trip.title}
                            className="w-24 h-24 object-cover rounded-lg"
                            onError={(e) => handleImageError(e, trip.id)}
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground mb-1">{trip.title}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                              <MapPin className="w-4 h-4" />
                              {trip.location}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              {formatDateRange(trip.start_date, trip.end_date)}
                            </div>
                            <Badge className={`${difficultyColors[trip.difficulty]} border mt-2`}>
                              <TrendingUp className="w-3 h-3 mr-1" />
                              {trip.difficulty}
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div>
            {/* Collaborates With Section */}
            {organizers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-[#0c281c]" />
                    {language === 'el' ? 'Συνεργάζεται με' : 'Collaborates With'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {organizers.map(organizer => (
                      <Link
                        key={organizer.organizer_code}
                        to={organizer.username
                          ? `/organizerprofile/${organizer.username}`
                          : `/organizerprofile?code=${organizer.organizer_code}`}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:border-emerald-600 hover:shadow-md transition-all"
                      >
                        {organizer.profile_picture_url ? (
                          <img
                            src={organizer.profile_picture_url}
                            alt={organizer.full_name}
                            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-[#0c281c] font-semibold text-lg">
                              {(organizer.full_name || organizer.username || '?')[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-foreground">
                            {organizer.full_name || organizer.username}
                          </p>
                          {organizer.verified && (
                            <Badge variant="outline" className="mt-1">
                              <Shield className="w-3 h-3 mr-1" />
                              {language === 'el' ? 'Επαληθευμένος' : 'Verified'}
                            </Badge>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      </div>
    </>
  );
}