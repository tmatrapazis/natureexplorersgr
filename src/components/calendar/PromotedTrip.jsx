import React from "react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, TrendingUp, Star, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../translations/useTranslations';
import { getTripImage, handleImageError } from '../helpers/imageHelpers';
import { formatPriceForCard } from '../helpers/pricingHelpers';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

const difficultyColors = {
  easy: "bg-green-100 text-green-800 border-green-200",
  moderate: "bg-yellow-100 text-yellow-800 border-yellow-200",
  challenging: "bg-orange-100 text-orange-800 border-orange-200",
  difficult: "bg-red-100 text-red-800 border-red-200"
};

export default function PromotedTrip({ trips, currentDate }) {
  const { language } = useLanguage();
  const { t } = useTranslation(language);

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

    // Find trips marked as promoted
    const promoted = tripsInCurrentMonth.filter(trip => trip.is_promoted === true);
    if (!promoted.length) return null;
    // Return the first promoted trip
    return promoted[0];
  }, [trips, currentDate]);

  if (!promotedTrip) {
    return null;
  }

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 flex items-center gap-2">
        <Star className="w-4 h-4 text-white fill-white" />
        <span className="text-white font-semibold text-sm">
        </span>
        {user?.organizer_code && user.organizer_code.trim().length > 0 && (
          <div className="ml-auto flex items-center gap-1 text-white/90 text-xs">
            <Eye className="w-3 h-3" />
            <span>{promotedTrip.view_count || 0} {language === 'el' ? 'προβολές' : 'views'}</span>
          </div>
        )}
      </div>

      <div className="relative w-full h-48 bg-muted">
        <img 
          src={getTripImage(promotedTrip.image_url, promotedTrip.id)} 
          alt={promotedTrip.title}
          className="w-full h-full object-cover"
          onError={(e) => handleImageError(e, promotedTrip.id)}
        />
      </div>
      
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-2">
          {promotedTrip.title}
        </h3>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge className={`${difficultyColors[promotedTrip.difficulty]} border`}>
            <TrendingUp className="w-3 h-3 mr-1" />
            {promotedTrip.difficulty}
          </Badge>
          <Badge variant="outline" className="text-emerald-700 border-emerald-300">
            {formatPriceForCard(promotedTrip, language)}
          </Badge>
          {promotedTrip.status === 'upcoming' && (
            <Badge className="bg-green-100 text-green-800 border-green-200 border text-xs">
              {language === 'el' ? 'Διαθέσιμο' : 'Available'}
            </Badge>
          )}
          {promotedTrip.status === 'almost soldout' && (
            <Badge className="bg-orange-100 text-orange-800 border-orange-200 border text-xs">
              {language === 'el' ? 'Σχεδόν γεμάτο' : 'Almost Full'}
            </Badge>
          )}
        </div>

        <div className="space-y-2 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{format(new Date(promotedTrip.start_date), "MMMM d, yyyy")}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="line-clamp-1">{promotedTrip.location}</span>
          </div>
        </div>

        {promotedTrip.description && (
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
            {promotedTrip.description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}
          </p>
        )}

        <div className="mt-auto">
          <Link to={`${createPageUrl("TripDetails")}?id=${promotedTrip.id}`}>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
              {t('trip.view_details')}
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}