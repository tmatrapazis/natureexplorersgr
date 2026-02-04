import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { X, Heart } from "lucide-react";
import CalendarGrid from "../components/calendar/CalendarGrid";
import TripsList from "../components/calendar/TripsList";
import TripFilters from "../components/calendar/TripFilters";
import PromotedTrip from "../components/calendar/PromotedTrip.jsx";
import { getComputedTripStatus } from "../components/helpers/tripHelpers";
import { useLanguage } from "../components/contexts/LanguageContext";
import { useTranslation } from "../components/translations/useTranslations";
import useSEO from "../components/seo/useSEO";
import { toZonedTime } from "date-fns-tz";

// Athens timezone
const ATHENS_TIMEZONE = 'Europe/Athens';

export default function CalendarPage() {
  const { language } = useLanguage();
  const { t } = useTranslation(language);

  // SEO Configuration with keywords
  useSEO({
    title: language === 'el' ?
    'Ημερολόγιο Πεζοπορίας | Εκδρομές Ορειβασία | Οργανωμένες Εκδρομές Βουνό | Nature Explorers' :
    'Hiking Calendar Greece | Upcoming Trekking Trips & Hiking Events | Nature Explorers',
    description: language === 'el' ?
    'Περιηγηθείτε και κλείστε επερχόμενες πεζοπορικές εκδρομές σε όλη την Ελλάδα. Βρείτε trekking περιπέτειες, outdoor δραστηριότητες, ημερολόγιο εκδρομών και ορειβατικές διαδρομές με πιστοποιημένους τοπικούς οδηγούς. Πεζοπορία Πάρνηθα, Όλυμπος, Πήλιο, Κρήτη.' :
    'Browse and book upcoming hiking trips Greece, trekking adventures, and hiking events. Explore weekend hiking trips, one day hikes Greece, mountain trekking calendar with verified organizers. Hiking Parnitha, Olympus, Pelion, Crete.',
    image: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68edfeced35e3590d79eccb8/01040e5a0_logo.png',
    url: window.location.href,
    type: 'website'
  });

  const [currentDate, setCurrentDate] = useState(toZonedTime(new Date(), ATHENS_TIMEZONE));
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDayTrips, setSelectedDayTrips] = useState([]);
  const [filters, setFilters] = useState({
    difficulty: "all",
    minPrice: "",
    maxPrice: "",
    tags: [],
    verifiedOnly: false,
    searchQuery: "",
    favoritesOnly: false
  });
  const [currentPage, setCurrentPage] = useState(1);
  const tripsListRef = React.useRef(null);

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ['current-user-calendar'],
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

  const { data: trips, isLoading } = useQuery({
    queryKey: ['hiking-trips'],
    queryFn: () => base44.entities.HikingTrip.list("start_date"),
    initialData: []
  });

  const activeTrips = trips.filter((trip) => {
    const status = getComputedTripStatus(trip);
    return status === 'upcoming' || status === 'happening now';
  });

  // Filter trips by the currently displayed month (Athens timezone)
  const tripsInCurrentMonth = activeTrips.filter((trip) => {
    const tripDate = toZonedTime(new Date(trip.start_date), ATHENS_TIMEZONE);
    return tripDate.getMonth() === currentDate.getMonth() &&
    tripDate.getFullYear() === currentDate.getFullYear();
  });

  const filteredTrips = tripsInCurrentMonth.filter((trip) => {
    if (filters.difficulty !== "all" && trip.difficulty !== filters.difficulty) {
      return false;
    }

    if (filters.minPrice && trip.price < parseFloat(filters.minPrice)) {
      return false;
    }
    if (filters.maxPrice && trip.price > parseFloat(filters.maxPrice)) {
      return false;
    }

    if (filters.tags.length > 0) {
      const tripTags = trip.tags || [];
      const hasMatchingTag = filters.tags.some((tag) => tripTags.includes(tag));
      if (!hasMatchingTag) return false;
    }

    if (filters.verifiedOnly && !trip.organizer_is_verified) {
      return false;
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesSearch =
      trip.title?.toLowerCase().includes(query) ||
      trip.location?.toLowerCase().includes(query) ||
      trip.description?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    if (filters.favoritesOnly) {
      const favoriteTripIds = new Set(favorites.map(fav => fav.trip_id));
      if (!favoriteTripIds.has(trip.id)) return false;
    }

    return true;
  });

  const handleDayClick = (day, dayTrips) => {
    if (dayTrips.length > 0) {
      setSelectedDate(day);
      setSelectedDayTrips(dayTrips);
      // Auto scroll to trips list after a short delay
      setTimeout(() => {
        if (tripsListRef.current) {
          tripsListRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  const handleClearAll = () => {
    setFilters({
      difficulty: "all",
      minPrice: "",
      maxPrice: "",
      tags: [],
      verifiedOnly: false,
      searchQuery: "",
      favoritesOnly: false
    });
    setSelectedDate(null);
    setSelectedDayTrips([]);
    setCurrentPage(1);
  };

  const displayTrips = selectedDate ? selectedDayTrips : filteredTrips;

  const hasActiveFilters = filters.difficulty !== "all" ||
  filters.minPrice ||
  filters.maxPrice ||
  filters.tags.length > 0 ||
  filters.verifiedOnly ||
  filters.searchQuery ||
  filters.favoritesOnly ||
  selectedDate;

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters, selectedDate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-emerald-50/30 to-stone-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mb-2">
            {language === 'el' ? 'Ημερολόγιο Πεζοπορικών Εκδρομών' : t('calendar.title')}
          </h1>
          <p className="text-stone-600">
            {language === 'el' ?
            'Ανακαλύψτε επερχόμενες εκδρομές trekking, ορειβασία και hiking events σε όλη την Ελλάδα. Οργανωμένες εκδρομές βουνό και weekend adventures.' :
            'Discover upcoming hiking trips Greece, trekking expeditions and outdoor adventures. Weekend hiking ideas and one day hikes across Greek nature trails.'}
          </p>
        </header>

        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <TripFilters filters={filters} onFilterChange={setFilters} />
          
          {user && (
            <Button
              variant={filters.favoritesOnly ? "default" : "outline"}
              onClick={() => setFilters({ ...filters, favoritesOnly: !filters.favoritesOnly })}
              className={filters.favoritesOnly ? "bg-red-500 hover:bg-red-600 text-white" : "border-red-300 text-red-700 hover:bg-red-50"}
            >
              <Heart className={`w-4 h-4 mr-2 ${filters.favoritesOnly ? 'fill-current' : ''}`} />
              {language === 'el' ? 'Αγαπημένα' : 'Favorites'}
            </Button>
          )}

          <div className="bg-emerald-100 text-emerald-800 px-4 py-2.5 text-sm font-medium rounded-md border border-emerald-200 inline-flex items-center justify-center h-9">
            {filteredTrips.length} {language === 'el' ? 'εκδρομές' : 'trips'}
          </div>

          {hasActiveFilters &&
          <Button
            variant="outline"
            onClick={handleClearAll}
            className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800">

              <X className="w-4 h-4 mr-2" />
              {t('filters.clear')}
            </Button>
          }
        </div>

        <div className="flex flex-col gap-8">
          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <CalendarGrid
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                trips={filteredTrips}
                onDayClick={handleDayClick}
                selectedDate={selectedDate} />

            </div>

            <div ref={tripsListRef}>
              {isLoading ?
              <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" />
                </div> :

              <PromotedTrip trips={activeTrips} currentDate={currentDate} />
              }
            </div>
          </div>

          <div>
            {isLoading ?
            <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" />
              </div> :

            <TripsList 
              trips={displayTrips} 
              selectedDate={selectedDate}
              currentPage={currentPage}
              tripsPerPage={12}
              onPageChange={setCurrentPage}
            />
            }
          </div>
        </div>
      </div>
    </div>);

}