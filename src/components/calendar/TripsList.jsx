import React from "react";
import { format } from "date-fns";
import { Calendar, MapPin, User, Star } from "lucide-react";
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
import { prefetchTripDetails } from '@/lib/prefetch';

const difficultyBadgeClass = "bg-brand-gold-accent text-brand-gold text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide";

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {trips.map((trip) => {
          const organizer = organizerMap[trip.organizer_code];
          const formattedDate = format(new Date(trip.start_date), "MMM d, yyyy");
          const price = formatPriceForCard(trip, language);

          return (
            <div
              key={trip.id}
              style={{ contentVisibility: 'auto', containIntrinsicSize: '0 340px' }}
            >
              <Link
                to={`${createPageUrl("TripDetails")}?id=${trip.id}`}
                onClick={() => handleViewDetailsClick(trip)}
                onPointerEnter={() => prefetchTripDetails(trip.id)}
                aria-label={`${t('trip.view_details')}: ${trip.title}`}
                className="block"
              >
                <div
                  role="article"
                  aria-label={trip.title}
                  className="relative rounded-xl overflow-hidden group cursor-pointer aspect-[4/3] md:aspect-[4/3] shadow-md hover:shadow-xl transition-shadow duration-300"
                >
                  {/* Full-bleed photo */}
                  <OptimizedImage
                    src={getTripImage(trip.image_url, trip.id)}
                    alt={language === 'el'
                      ? `${trip.title} - πεζοπορική εκδρομή ${trip.location} - ορειβασία trekking outdoor adventure Ελλάδα`
                      : `${trip.title} - hiking trip ${trip.location} - mountain trekking outdoor activity Greece`}
                    width={800}
                    height={600}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    onError={(e) => handleImageError(e, trip.id)}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Deep Forest gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/50 to-transparent" />

                  {/* Content anchored to bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                    {/* Badges row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {trip.difficulty && (
                        <span
                          className={difficultyBadgeClass}
                          style={{ fontFamily: 'var(--font-heading)' }}
                        >
                          {trip.difficulty}
                        </span>
                      )}
                      {trip.id === promotedTripId && (
                        <span className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                          <Star className="w-3 h-3 fill-white" aria-hidden="true" />
                          {language === 'el' ? 'Δημοφιλής' : 'Popular'}
                        </span>
                      )}
                      {trip.status === 'almost soldout' && (
                        <span className="bg-orange-500 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                          {language === 'el' ? 'Σχεδόν γεμάτο' : 'Almost Full'}
                        </span>
                      )}
                    </div>

                    {/* Trip title */}
                    <h4
                      className="font-bold text-brand-gold text-lg leading-tight line-clamp-2"
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      {trip.title}
                    </h4>

                    {/* Meta row: date + price */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-brand-gold/80 text-sm">
                        <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{formattedDate}</span>
                      </div>
                      <span
                        className="font-bold text-brand-gold-accent text-base"
                        style={{ fontFamily: 'var(--font-heading)' }}
                      >
                        {price}
                      </span>
                    </div>

                    {/* Organizer */}
                    {organizer && organizer.full_name && (
                      <div className="flex items-center gap-1.5 text-brand-gold/60 text-xs">
                        <User className="w-3 h-3" aria-hidden="true" />
                        <span>by {organizer.full_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}));

export default TripsList;
