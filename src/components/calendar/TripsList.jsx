import React from "react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, ExternalLink, User, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { Organizer } from "@/api/db";
import { useAuth } from "@/lib/AuthContext";

import { trackEvent } from "../analytics/GoogleAnalytics";
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../translations/useTranslations';
import { getTripImage, handleImageError } from '../helpers/imageHelpers';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { formatPriceForCard } from '../helpers/pricingHelpers';

const difficultyColors = {
  easy: "bg-emerald-100 text-emerald-800 border-emerald-300",
  moderate: "bg-amber-100 text-amber-800 border-amber-300",
  challenging: "bg-orange-100 text-orange-800 border-orange-300",
  difficult: "bg-red-100 text-red-800 border-red-300"
};

const TripsList = React.memo(React.forwardRef(function TripsList({ trips, selectedDate, promotedTripId }, ref) {
  const { language } = useLanguage();
  const { t } = useTranslation(language);

  const { user } = useAuth();

  // Fetch all organizers to match with trips
  const { data: organizers = [] } = useQuery({
    queryKey: ['all-organizers'],
    queryFn: () => Organizer.list(),
    initialData: [],
  });

  // Create a map of organizer_code -> organizer for quick lookup
  const organizerMap = React.useMemo(() => {
    const map = {};
    organizers.forEach(org => {
      map[org.organizer_code] = org;
    });
    return map;
  }, [organizers]);

  // Handler for "View Details" button clicks
  const handleViewDetailsClick = (trip) => {
    trackEvent('view_details_click', {
      event_category: 'Trip Discovery',
      event_label: trip.title,
      trip_id: trip.id,
      organizer_name: organizerMap[trip.organizer_code]?.username || 'Unknown',
      difficulty: trip.difficulty,
      price: trip.price,
      source: selectedDate ? 'calendar_date' : 'upcoming_trips_list',
    });
  };

  if (trips.length === 0) {
    return (
      <div className="text-center py-12" role="status">
        <Calendar className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" aria-hidden="true" />
        <h3 className="text-lg font-semibold text-foreground mb-2">{t('calendar.no_trips')}</h3>
        <p className="text-muted-foreground">
          {selectedDate ? `${t('calendar.no_trips_scheduled')} ${format(selectedDate, "MMMM d, yyyy")}` : t('calendar.select_date')}
        </p>
      </div>
    );
  }

  return (
    <div ref={ref}>
      {/* CSS grid with content-visibility:auto for browser-native render skipping of off-screen cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {trips.map((trip) => {
          const organizer = organizerMap[trip.organizer_code];

          return (
            /* content-visibility:auto tells the browser to skip layout/paint for off-screen cards,
               achieving the same performance benefit as JS-based virtualization without extra dependencies */
            <div
              key={trip.id}
              style={{ contentVisibility: 'auto', containIntrinsicSize: '0 468px' }}
            >
              <Card
                role="article"
                aria-label={trip.title}
                className={`overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col h-full ${trip.id === promotedTripId ? 'border-amber-400 ring-2 ring-amber-300' : 'border-border'}`}
              >
                <div className="w-full h-40 bg-muted relative overflow-hidden">
                  <OptimizedImage
                    src={getTripImage(trip.image_url, trip.id)}
                    alt={language === 'el'
                      ? `${trip.title} - πεζοπορική εκδρομή ${trip.location} - ορειβασία trekking outdoor adventure Ελλάδα`
                      : `${trip.title} - hiking trip ${trip.location} - mountain trekking outdoor activity Greece`}
                    width={800}
                    height={320}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    onError={(e) => handleImageError(e, trip.id)}
                  />
                  {trip.id === promotedTripId && (
                    <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow">
                      <Star className="w-3 h-3 fill-white" aria-hidden="true" />
                      {language === 'el' ? 'Δημοφιλής' : 'Popular'}
                    </div>
                  )}
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-bold text-foreground mb-2 line-clamp-2 h-12">{trip.title}</h4>
                        <div className="flex flex-wrap items-center gap-1.5 mb-2">
                          <Badge className={`${difficultyColors[trip.difficulty]} border text-xs`}>
                            {trip.difficulty}
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
                          <div className="flex flex-wrap gap-1 mb-2">
                            {trip.departure_from.map((location, idx) => (
                              <Badge key={idx} variant="outline" className="border-blue-300 text-blue-700 text-xs">
                                📍 {location}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="h-6 mb-2">
                      {organizer && organizer.username && (
                        <Link
                          to={`${createPageUrl("OrganizerProfile")}/${organizer.username}`}
                          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[#0c281c]"
                        >
                          <User className="w-3 h-3" aria-hidden="true" />
                          <span>by {organizer.full_name}</span>
                        </Link>
                      )}
                    </div>

                    <div className="space-y-1 text-xs text-muted-foreground mb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-[#0c281c] flex-shrink-0" aria-hidden="true" />
                          <span>{format(new Date(trip.start_date), "MMM d, yyyy")}</span>
                        </div>
                        <span className="font-bold text-[#0c281c]">
                          {formatPriceForCard(trip, language)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-[#0c281c] flex-shrink-0" aria-hidden="true" />
                        <span className="line-clamp-1">{trip.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-auto">
                    <Link
                      to={`${createPageUrl("TripDetails")}?id=${trip.id}`}
                      className="flex-1"
                      onClick={() => handleViewDetailsClick(trip)}
                      aria-label={`${t('trip.view_details')}: ${trip.title}`}
                    >
                      <Button size="sm" className="bg-[#0c281c] hover:bg-[#0c281c]/90 w-full min-h-[44px]" tabIndex={-1}>
                        {t('trip.view_details')}
                      </Button>
                    </Link>
                    {user && trip.external_link && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="min-h-[44px] min-w-[44px]"
                        aria-label={`${language === 'el' ? 'Εξωτερικός σύνδεσμος για' : 'External link for'} ${trip.title}`}
                        asChild
                      >
                        <a href={trip.external_link} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3" aria-hidden="true" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}));

export default TripsList;
