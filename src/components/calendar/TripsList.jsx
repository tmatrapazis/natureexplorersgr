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
import { formatPriceForCard } from '../helpers/pricingHelpers';

const difficultyColors = {
  easy: "bg-emerald-100 text-emerald-800 border-emerald-300",
  moderate: "bg-amber-100 text-amber-800 border-amber-300",
  challenging: "bg-orange-100 text-orange-800 border-orange-300",
  difficult: "bg-red-100 text-red-800 border-red-300"
};

export default React.forwardRef(function TripsList({ trips, selectedDate, promotedTripId }, ref) {
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
      <div className="text-center py-12">
        <Calendar className="w-16 h-16 mx-auto text-stone-300 mb-4" />
        <h3 className="text-lg font-semibold text-stone-700 mb-2">{t('calendar.no_trips')}</h3>
        <p className="text-stone-500">
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
          className="gap-1"
        >
          <Languages className="w-4 h-4" />
          <span>{isTranslating ? '...' : translatedTitles ? 'Original Titles' : 'Translate Titles'}</span>
        </Button>
      </div>
      
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {trips.map((trip) => {
          const organizer = organizerMap[trip.organizer_code];
          
          return (
            <Card key={trip.id} className={`overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col h-full ${trip.id === promotedTripId ? 'border-amber-400 ring-2 ring-amber-300' : 'border-stone-200'}`}>
              <div className="w-full h-40 bg-stone-200 relative">
                <img 
                  src={getTripImage(trip.image_url, trip.id)} 
                  alt={language === 'el'
                    ? `${trip.title} - πεζοπορική εκδρομή ${trip.location} - ορειβασία trekking outdoor adventure Ελλάδα`
                    : `${trip.title} - hiking trip ${trip.location} - mountain trekking outdoor activity Greece`}
                  className="w-full h-full object-cover"
                  onError={(e) => handleImageError(e, trip.id)}
                />
                {trip.id === promotedTripId && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow">
                    <Star className="w-3 h-3 fill-white" />
                    {language === 'el' ? 'Δημοφιλής' : 'Popular'}
                  </div>
                )}
              </div>
              
              <div className="p-4 flex flex-col flex-1">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-bold text-stone-900 mb-2 line-clamp-2 h-12">{translatedTitles?.[trip.id] || trip.title}</h4>
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
                        className="inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-emerald-700"
                      >
                        <User className="w-3 h-3" />
                        <span>by {organizer.full_name}</span>
                      </Link>
                    )}
                  </div>

                  <div className="space-y-1 text-xs text-stone-600 mb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                        <span>{format(new Date(trip.start_date), "MMM d, yyyy")}</span>
                      </div>
                      <span className="font-bold text-emerald-700">
                        {formatPriceForCard(trip, language)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                      <span className="line-clamp-1">{trip.location}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-auto">
                  <Link 
                    to={`${createPageUrl("TripDetails")}?id=${trip.id}`} 
                    className="flex-1"
                    onClick={() => handleViewDetailsClick(trip)}
                  >
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 w-full">
                      {t('trip.view_details')}
                    </Button>
                  </Link>
                  {user && trip.external_link && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={trip.external_link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
});