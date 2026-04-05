import React from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Star, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../translations/useTranslations';
import { getTripImage, handleImageError } from '../helpers/imageHelpers';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { formatPriceForCard } from '../helpers/pricingHelpers';

import { useAuth } from '@/lib/AuthContext';

function PromotedTrip({ trips, currentDate }) {
  const { language } = useLanguage();
  const { t } = useTranslation(language);

  const { user } = useAuth();

  // Filter trips by the current month and find promoted trips
  const promotedTrip = React.useMemo(() => {
    if (!trips || trips.length === 0 || !currentDate) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tripsInCurrentMonth = trips.filter(trip => {
      const tripDate = new Date(trip.start_date);
      return tripDate >= today &&
             tripDate.getMonth() === currentDate.getMonth() &&
             tripDate.getFullYear() === currentDate.getFullYear();
    });

    if (tripsInCurrentMonth.length === 0) return null;

    // Find trips marked as promoted for the calendar and whose promotion hasn't expired
    const now = new Date();
    const promoted = tripsInCurrentMonth.filter(trip =>
      trip.is_promoted_calendar === true &&
      (!trip.promoted_calendar_until || new Date(trip.promoted_calendar_until) > now)
    );
    if (!promoted.length) return null;
    return promoted[0];
  }, [trips, currentDate]);

  if (!promotedTrip) {
    return null;
  }

  const formattedDate = format(new Date(promotedTrip.start_date), "MMMM d, yyyy");
  const price = formatPriceForCard(promotedTrip, language);

  return (
    <Link
      to={`${createPageUrl("TripDetails")}?id=${promotedTrip.id}`}
      aria-label={`${t('trip.view_details')}: ${promotedTrip.title}`}
      className="block"
    >
      <div className="relative rounded-xl overflow-hidden group cursor-pointer aspect-[4/3] md:aspect-[16/9] shadow-md hover:shadow-xl transition-shadow duration-300">
        {/* Full-bleed photo */}
        <OptimizedImage
          src={getTripImage(promotedTrip.image_url, promotedTrip.id)}
          alt={promotedTrip.title}
          width={800}
          height={450}
          sizes="(max-width: 1024px) 100vw, 50vw"
          onError={(e) => handleImageError(e, promotedTrip.id)}
          priority
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Deep Forest gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c281c] via-[#0c281c]/50 to-transparent" />

        {/* Promoted badge — top-left */}
        <div className="absolute top-3 left-3 flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
          <Star className="w-3 h-3 fill-white" aria-hidden="true" />
          {language === 'el' ? 'Δημοφιλής εκδρομή' : 'Featured Trip'}
        </div>

        {/* View count for organizers — top-right */}
        {user?.organizer_code && user.organizer_code.trim().length > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-[#0c281c]/70 text-[#f0e3c7]/90 text-xs px-2 py-1 rounded-full">
            <Eye className="w-3 h-3" aria-hidden="true" />
            <span>{promotedTrip.view_count || 0}</span>
          </div>
        )}

        {/* Content anchored to bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          {/* Difficulty badge */}
          {promotedTrip.difficulty && (
            <div>
              <span
                className="text-xs font-bold bg-[#8B6914] text-[#f0e3c7] px-2.5 py-0.5 rounded-full uppercase tracking-wide"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {promotedTrip.difficulty}
              </span>
            </div>
          )}

          {/* Title */}
          <h3
            className="font-bold text-[#f0e3c7] text-xl md:text-2xl leading-tight line-clamp-2"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {promotedTrip.title}
          </h3>

          {/* Meta row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-[#f0e3c7]/80 text-sm">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                {formattedDate}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="line-clamp-1">{promotedTrip.location}</span>
              </span>
            </div>
            <span
              className="font-bold text-[#8B6914] text-lg"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {price}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
export default React.memo(PromotedTrip);
