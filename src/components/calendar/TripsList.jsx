import React from "react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, ExternalLink, User, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { trackEvent } from "../analytics/GoogleAnalytics";
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../translations/useTranslations';
import { getTripImage, handleImageError } from '../helpers/imageHelpers';
import { toast } from 'react-hot-toast';

const difficultyColors = {
  easy: "bg-green-100 text-green-800 border-green-200",
  moderate: "bg-yellow-100 text-yellow-800 border-yellow-200",
  challenging: "bg-orange-100 text-orange-800 border-orange-200",
  difficult: "bg-red-100 text-red-800 border-red-200"
};

export default React.forwardRef(function TripsList({ trips, selectedDate, currentPage = 1, tripsPerPage = 12, onPageChange }, ref) {
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const queryClient = useQueryClient();
  
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

  // Fetch user's favorites
  const { data: favorites = [] } = useQuery({
    queryKey: ['user-favorites', user?.id],
    queryFn: () => base44.entities.Favorite.filter({ user_id: user.id }),
    enabled: !!user,
    initialData: [],
  });

  // Create a set of favorited trip IDs for quick lookup
  const favoriteTripIds = React.useMemo(() => {
    return new Set(favorites.map(fav => fav.trip_id));
  }, [favorites]);

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ trip, isFavorited }) => {
      if (isFavorited) {
        // Remove from favorites
        const favorite = favorites.find(fav => fav.trip_id === trip.id);
        if (favorite) {
          await base44.entities.Favorite.delete(favorite.id);
        }
      } else {
        // Add to favorites
        await base44.entities.Favorite.create({
          user_id: user.id,
          trip_id: trip.id,
          trip_title: trip.title,
          trip_start_date: trip.start_date,
        });
      }
    },
    onSuccess: (_, { isFavorited }) => {
      queryClient.invalidateQueries({ queryKey: ['user-favorites'] });
      toast.success(isFavorited 
        ? (language === 'el' ? 'Αφαιρέθηκε από τα αγαπημένα' : 'Removed from favorites')
        : (language === 'el' ? 'Προστέθηκε στα αγαπημένα' : 'Added to favorites')
      );
    },
    onError: () => {
      toast.error(language === 'el' ? 'Κάτι πήγε στραβά' : 'Something went wrong');
    },
  });

  const handleFavoriteClick = (trip, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      base44.auth.redirectToLogin(window.location.pathname);
      return;
    }

    const isFavorited = favoriteTripIds.has(trip.id);
    toggleFavoriteMutation.mutate({ trip, isFavorited });
  };

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

  // Pagination logic
  const totalPages = Math.ceil(trips.length / tripsPerPage);
  const startIndex = (currentPage - 1) * tripsPerPage;
  const endIndex = startIndex + tripsPerPage;
  const paginatedTrips = trips.slice(startIndex, endIndex);

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
        <h3 className="text-xl font-bold text-stone-900">
          {selectedDate ? `${t('calendar.trips_on')} ${format(selectedDate, "MMMM d, yyyy")}` : t('calendar.upcoming_trips')}
        </h3>
        <div className="text-sm text-stone-600">
          {language === 'el' 
            ? `Εμφάνιση ${startIndex + 1}-${Math.min(endIndex, trips.length)} από ${trips.length}` 
            : `Showing ${startIndex + 1}-${Math.min(endIndex, trips.length)} of ${trips.length}`}
        </div>
      </div>
      
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {paginatedTrips.map((trip) => {
          const organizer = organizerMap[trip.organizer_code];
          const isFavorited = favoriteTripIds.has(trip.id);
          
          return (
            <Card key={trip.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200 border-stone-200 flex flex-col h-full">
              <div className="relative w-full h-40 bg-stone-200">
                <img 
                  src={getTripImage(trip.image_url, trip.id)} 
                  alt={language === 'el'
                    ? `${trip.title} - πεζοπορική εκδρομή ${trip.location} - ορειβασία trekking outdoor adventure Ελλάδα`
                    : `${trip.title} - hiking trip ${trip.location} - mountain trekking outdoor activity Greece`}
                  className="w-full h-full object-cover"
                  onError={(e) => handleImageError(e, trip.id)}
                />
                <button
                  onClick={(e) => handleFavoriteClick(trip, e)}
                  className={`absolute top-2 right-2 p-2 rounded-full transition-all ${
                    isFavorited 
                      ? 'bg-red-500 text-white hover:bg-red-600' 
                      : 'bg-white/90 text-stone-600 hover:bg-white hover:text-red-500'
                  }`}
                  title={isFavorited 
                    ? (language === 'el' ? 'Αφαίρεση από αγαπημένα' : 'Remove from favorites')
                    : (language === 'el' ? 'Προσθήκη στα αγαπημένα' : 'Add to favorites')
                  }
                >
                  <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                </button>
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
                      <span className="font-bold text-emerald-700">
                        {trip.price ? `€${trip.price}` : 'TBA'}
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage === 1}
          >
            {language === 'el' ? 'Προηγούμενο' : 'Previous'}
          </Button>
          
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange?.(page)}
                className={page === currentPage ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
              >
                {page}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            {language === 'el' ? 'Επόμενο' : 'Next'}
          </Button>
        </div>
      )}
    </div>
  );
});