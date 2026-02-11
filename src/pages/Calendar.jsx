import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import CalendarGrid from "../components/calendar/CalendarGrid";
import TripsList from "../components/calendar/TripsList";
import TripFilters from "../components/calendar/TripFilters";
import PromotedTrip from "../components/calendar/PromotedTrip.jsx";
import PullToRefresh from "../components/ui/PullToRefresh";
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
  const queryClient = useQueryClient();

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
    searchQuery: ""
  });
  const [currentPage, setCurrentPage] = useState(1);
  const tripsPerPage = 12;
  const tripsListRef = React.useRef(null);

  const { data: trips, isLoading } = useQuery({
    queryKey: ['hiking-trips'],
    queryFn: () => base44.entities.HikingTrip.list("start_date"),
    initialData: []
  });

  const { data: organizers = [] } = useQuery({
    queryKey: ['organizers-calendar'],
    queryFn: () => base44.entities.Organizer.list(),
    initialData: []
  });

  // Create organizer map for quick lookup
  const organizerMap = React.useMemo(() => {
    const map = {};
    organizers.forEach(org => {
      map[org.organizer_code] = org;
    });
    return map;
  }, [organizers]);

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

    if (filters.verifiedOnly) {
      const organizer = organizerMap[trip.organizer_code];
      if (!organizer || !organizer.is_verified) {
        return false;
      }
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesSearch =
      trip.title?.toLowerCase().includes(query) ||
      trip.location?.toLowerCase().includes(query) ||
      trip.description?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
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
      searchQuery: ""
    });
    setSelectedDate(null);
    setSelectedDayTrips([]);
    setCurrentPage(1);
  };

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters, selectedDate, currentDate]);

  // Calculate pagination
  const totalPages = selectedDate ? 1 : Math.ceil(filteredTrips.length / tripsPerPage);
  const startIndex = (currentPage - 1) * tripsPerPage;
  const endIndex = startIndex + tripsPerPage;
  
  const displayTrips = selectedDate ? selectedDayTrips : filteredTrips.slice(startIndex, endIndex);

  const hasActiveFilters = filters.difficulty !== "all" ||
  filters.minPrice ||
  filters.maxPrice ||
  filters.tags.length > 0 ||
  filters.verifiedOnly ||
  filters.searchQuery ||
  selectedDate;

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.refetchQueries({ queryKey: ['hiking-trips'] }),
      queryClient.refetchQueries({ queryKey: ['organizers-calendar'] })
    ]);
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen bg-gradient-to-br from-background via-emerald-50/30 dark:via-emerald-950/10 to-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            {language === 'el' ? 'Ημερολόγιο Πεζοπορικών Εκδρομών' : t('calendar.title')}
          </h1>
          <p className="text-muted-foreground">
            {language === 'el' ?
            'Ανακαλύψτε επερχόμενες εκδρομές trekking, ορειβασία και hiking events σε όλη την Ελλάδα. Οργανωμένες εκδρομές βουνό και weekend adventures.' :
            'Discover upcoming hiking trips Greece, trekking expeditions and outdoor adventures. Weekend hiking ideas and one day hikes across Greek nature trails.'}
          </p>
        </header>

        <div className="flex gap-3 mb-6 items-center">
          <TripFilters filters={filters} onFilterChange={setFilters} />
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

            <>
                <TripsList trips={displayTrips} selectedDate={selectedDate} />
                {!selectedDate && totalPages > 1 &&
              <div className="flex justify-center items-center gap-2 mt-8">
                    <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">
                      {language === 'el' ? 'Προηγούμενη' : 'Previous'}
                    </Button>
                    
                    <div className="flex items-center gap-2">
                      {[...Array(totalPages)].map((_, i) => {
                        const pageNum = i + 1;
                        // Show first, last, current, and adjacent pages
                        if (
                          pageNum === 1 ||
                          pageNum === totalPages ||
                          Math.abs(pageNum - currentPage) <= 1
                        ) {
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              onClick={() => setCurrentPage(pageNum)}
                              className={currentPage === pageNum ? "bg-emerald-600 hover:bg-emerald-700" : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"}
                              size="sm"
                            >
                              {pageNum}
                            </Button>
                          );
                        } else if (
                         pageNum === currentPage - 2 ||
                         pageNum === currentPage + 2
                        ) {
                          return <span key={pageNum} className="px-2 text-muted-foreground">...</span>;
                        }
                        return null;
                      })}
                    </div>

                    <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">
                      {language === 'el' ? 'Επόμενη' : 'Next'}
                    </Button>
                  </div>
              }
              </>
            }
          </div>
        </div>
      </div>
    </div>
    </PullToRefresh>
  );
}