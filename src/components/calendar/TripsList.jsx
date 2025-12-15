import React from "react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, ExternalLink, User } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { trackEvent } from "../analytics/GoogleAnalytics";
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../translations/useTranslations';
import { getTripImage, handleImageError } from '../helpers/imageHelpers';

const difficultyColors = {
  easy: "bg-green-100 text-green-800 border-green-200",
  moderate: "bg-yellow-100 text-yellow-800 border-yellow-200",
  challenging: "bg-orange-100 text-orange-800 border-orange-200",
  difficult: "bg-red-100 text-red-800 border-red-200"
};

export default function TripsList({ trips, selectedDate }) {
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  
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
    <div>
      <h3 className="text-xl font-bold text-stone-900 mb-6">
        {selectedDate ? `${t('calendar.trips_on')} ${format(selectedDate, "MMMM d, yyyy")}` : t('calendar.upcoming_trips')}
      </h3>
      
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {trips.map((trip) => {
          const organizer = organizerMap[trip.organizer_code];
          
          return (
            <Card key={trip.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200 border-stone-200 flex flex-col h-full">
              <div className="w-full h-40 bg-stone-200">
                <img 
                  src={getTripImage(trip.image_url, trip.id)} 
                  alt={language === 'el'
                    ? `${trip.title} - πεζοπορική εκδρομή ${trip.location} - ορειβασία trekking outdoor adventure Ελλάδα`
                    : `${trip.title} - hiking trip ${trip.location} - mountain trekking outdoor activity Greece`}
                  className="w-full h-full object-cover"
                  onError={(e) => handleImageError(e, trip.id)}
                />
              </div>
              
              <div className="p-4 flex flex-col flex-1">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-bold text-stone-900 mb-2 line-clamp-2 h-12">{trip.title}</h4>
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        <Badge className={`${difficultyColors[trip.difficulty]} border text-xs`}>
                          {trip.difficulty}
                        </Badge>
                        {trip.distance_km && (
                          <Badge variant="outline" className="border-stone-300 text-xs">
                            {trip.distance_km} km
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="h-6 mb-2">
                    {organizer && (
                      <Link
                        to={`${createPageUrl("OrganizerProfile")}?code=${organizer.organizer_code}`}
                        className="inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-emerald-700"
                      >
                        <User className="w-3 h-3" />
                        <span>by {organizer.username || organizer.full_name}</span>
                      </Link>
                    )}
                  </div>

                  <div className="space-y-1 text-xs text-stone-600 mb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                        <span>{format(new Date(trip.start_date), "MMM d, yyyy")}</span>
                      </div>
                      {trip.price && (
                        <span className="font-bold text-emerald-700">€{trip.price}</span>
                      )}
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
}