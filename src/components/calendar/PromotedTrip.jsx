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

  // Find the most popular trip (highest view_count)
  const mostPopularTrip = React.useMemo(() => {
    if (!trips || trips.length === 0) return null;
    return trips.reduce((most, trip) => {
      return (trip.view_count || 0) > (most.view_count || 0) ? trip : most;
    }, trips[0]);
  }, [trips]);

  if (!mostPopularTrip) {
    return (
      <Card className="p-6 h-full flex items-center justify-center">
        <div className="text-center text-stone-500">
          <Star className="w-12 h-12 mx-auto mb-2 text-stone-300" />
          <p>{language === 'el' ? 'Δεν υπάρχουν διαθέσιμες εκδρομές' : 'No trips available'}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 flex items-center gap-2">
        <Star className="w-4 h-4 text-white fill-white" />
        <span className="text-white font-semibold text-sm">
          {language === 'el' ? 'Δημοφιλής Εκδρομή' : 'Popular Trip'}
        </span>
        {user?.role === 'admin' && (
          <div className="ml-auto flex items-center gap-1 text-white/90 text-xs">
            <Eye className="w-3 h-3" />
            <span>{mostPopularTrip.view_count || 0} {language === 'el' ? 'προβολές' : 'views'}</span>
          </div>
        )}
      </div>

      <div className="relative w-full h-48 bg-stone-200">
        <img 
          src={getTripImage(mostPopularTrip.image_url, mostPopularTrip.id)} 
          alt={mostPopularTrip.title}
          className="w-full h-full object-cover"
          onError={(e) => handleImageError(e, mostPopularTrip.id)}
        />
      </div>
      
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-xl font-bold text-stone-900 mb-2 line-clamp-2">
          {mostPopularTrip.title}
        </h3>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge className={`${difficultyColors[mostPopularTrip.difficulty]} border`}>
            <TrendingUp className="w-3 h-3 mr-1" />
            {mostPopularTrip.difficulty}
          </Badge>
          {mostPopularTrip.price && (
            <Badge variant="outline" className="text-emerald-700 border-emerald-300">
              €{mostPopularTrip.price}
            </Badge>
          )}
        </div>

        <div className="space-y-2 text-sm text-stone-600 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{format(new Date(mostPopularTrip.start_date), "MMMM d, yyyy")}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="line-clamp-1">{mostPopularTrip.location}</span>
          </div>
        </div>

        {mostPopularTrip.description && (
          <p className="text-sm text-stone-600 line-clamp-3 mb-4">
            {mostPopularTrip.description}
          </p>
        )}

        <div className="mt-auto">
          <Link to={`${createPageUrl("TripDetails")}?id=${mostPopularTrip.id}`}>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
              {t('trip.view_details')}
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}