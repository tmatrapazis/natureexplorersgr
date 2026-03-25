import React from "react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, ExternalLink, User, Languages, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { trackEvent } from "../analytics/GoogleAnalytics";
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../translations/useTranslations';
import { getTripImage, handleImageError } from '../helpers/imageHelpers';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { formatPriceForCard } from '../helpers/pricingHelpers';
import { FixedSizeList } from "react-window";

const TRIP_ROW_HEIGHT = 468; // px — approximate height of a single trip card row

const difficultyColors = {
  easy: "bg-emerald-100 text-emerald-800 border-emerald-300",
  moderate: "bg-amber-100 text-amber-800 border-amber-300",
  challenging: "bg-orange-100 text-orange-800 border-orange-300",
  difficult: "bg-red-100 text-red-800 border-red-300"
};

const TripsList = React.memo(React.forwardRef(function TripsList({ trips, selectedDate, promotedTripId }, ref) {
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const [translatedTitles, setTranslatedTitles] = React.useState(null);
  const [isTranslating, setIsTranslating] = React.useState(false);

  const handleTranslate = async () => {
    if (translatedTitles) {
      setTranslatedTitles(null);
      return;
    }
    setIsTranslating(true);
    try {
      const response = await base44.functions.invoke('translateTrip', {
        titles: trips.map(t => ({ id: t.id, title: t.title }))
      });
      const map = {};
      (response.data.translatedTitles || []).forEach(item => {
        map[item.id] = item.title;
      });
      setTranslatedTitles(map);
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setIsTranslating(false);
    }
  };
  
  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ['current-user-trips-list'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch (error) {
        return null;
      }
    },
    retry: false,
  });

  // Fetch all organizers to match with trips
  const { data: organizers = [] } = useQuery({
    queryKey: ['all-organizers'],
    queryFn: () => base44.entities.Organizer.list(),
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
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={handleTranslate}
          disabled={isTranslating}
          className="gap-1 min-h-[44px]"
          aria-label={isTranslating ? 'Translating titles…' : translatedTitles ? 'Show original titles' : 'Translate trip titles to English'}
        >
          <Languages className="w-4 h-4" aria-hidden="true" />
          <span>{isTranslating ? '...' : translatedTitles ? 'Original Titles' : 'Translate Titles'}</span>
        </Button>
      </div>
      
      <VirtualizedTripGrid
        trips={trips}
        organizerMap={organizerMap}
        promotedTripId={promotedTripId}
        translatedTitles={translatedTitles}
        language={language}
        t={t}
        user={user}
        handleViewDetailsClick={handleViewDetailsClick}
      />
    </div>
  );
}));

// ---------------------------------------------------------------------------
// Virtualized grid for trip cards using react-window FixedSizeList
// ---------------------------------------------------------------------------
function useGridColumns() {
  const getColumns = () => {
    if (typeof window === "undefined") return 4;
    if (window.innerWidth >= 1280) return 4;
    if (window.innerWidth >= 1024) return 3;
    if (window.innerWidth >= 640) return 2;
    return 1;
  };
  const [columns, setColumns] = React.useState(getColumns);
  React.useEffect(() => {
    const handle = () => setColumns(getColumns());
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);
  return columns;
}

function VirtualizedTripGrid({
  trips, organizerMap, promotedTripId, translatedTitles,
  language, t, user, handleViewDetailsClick
}) {
  const columns = useGridColumns();
  const GAP = 16; // gap-4 = 1rem = 16px

  const rows = React.useMemo(() => {
    const result = [];
    for (let i = 0; i < trips.length; i += columns) {
      result.push(trips.slice(i, i + columns));
    }
    return result;
  }, [trips, columns]);

  // Make the list exactly tall enough to render all rows without internal scroll.
  // The page's own scroll handles navigation — react-window still virtualises DOM nodes.
  const listHeight = rows.length * (TRIP_ROW_HEIGHT + GAP);

  const Row = React.useCallback(({ index, style }) => {
    const rowTrips = rows[index];
    return (
      <div style={{ ...style, display: "flex", gap: GAP, alignItems: "stretch" }}>
        {rowTrips.map((trip) => {
          const organizer = organizerMap[trip.organizer_code];
          return (
            <div key={trip.id} style={{ flex: 1, minWidth: 0 }}>
              <Card role="article" aria-label={trip.title} className={`overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col h-full ${trip.id === promotedTripId ? 'border-amber-400 ring-2 ring-amber-300' : 'border-border'}`}>
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
                      <h4 className="text-base font-bold text-foreground mb-2 line-clamp-2 h-12" id={`trip-title-${trip.id}`}>{translatedTitles?.[trip.id] || trip.title}</h4>
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
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-emerald-700"
                      >
                        <User className="w-3 h-3" aria-hidden="true" />
                        <span>by {organizer.full_name}</span>
                      </Link>
                    )}
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground mb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-emerald-600 flex-shrink-0" aria-hidden="true" />
                        <span>{format(new Date(trip.start_date), "MMM d, yyyy")}</span>
                      </div>
                      <span className="font-bold text-emerald-700">
                        {formatPriceForCard(trip, language)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-emerald-600 flex-shrink-0" aria-hidden="true" />
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
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 w-full min-h-[44px]" tabIndex={-1}>
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
      {/* Phantom cells so the last incomplete row fills the full width */}
      {Array.from({ length: columns - rowTrips.length }).map((_, i) => (
        <div key={`phantom-${i}`} style={{ flex: 1, minWidth: 0 }} aria-hidden="true" />
      ))}
    </div>
  );
  }, [rows, columns, organizerMap, promotedTripId, translatedTitles, language, t, user, handleViewDetailsClick]);

  return (
    <FixedSizeList
      height={listHeight}
      itemCount={rows.length}
      itemSize={TRIP_ROW_HEIGHT + GAP}
      width="100%"
      overscanCount={2}
    >
      {Row}
    </FixedSizeList>
  );
}

export default TripsList;