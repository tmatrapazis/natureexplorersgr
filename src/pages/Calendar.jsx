import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { X, List, Map } from "lucide-react";
import CalendarGrid from "../components/calendar/CalendarGrid";
import TripsList from "../components/calendar/TripsList";
import TripFilters from "../components/calendar/TripFilters";
import LazyTripsMap from "../components/lazy/LazyTripsMap";
import PromotedTrip from "../components/calendar/PromotedTrip";
import PullToRefresh from "../components/ui/PullToRefresh";
import PageWrapper from "../components/layout/PageWrapper";
import { getComputedTripStatus } from "../components/helpers/tripHelpers";
import { getLowestPrice } from "../components/helpers/pricingHelpers";
import { useLanguage } from "../components/contexts/LanguageContext";
import { useTranslation } from "../components/translations/useTranslations";
import useSEO from "../components/seo/useSEO";
import StructuredData from "../components/seo/StructuredData";
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
    url: 'https://natureexplorers.gr/Calendar',
    type: 'website'
  });

  const calendarBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Nature Explorers", "item": "https://natureexplorers.gr/" },
      { "@type": "ListItem", "position": 2, "name": language === 'el' ? "Ημερολόγιο Εκδρομών" : "Hiking Calendar", "item": "https://natureexplorers.gr/Calendar" }
    ]
  };

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
  const [sortBy, setSortBy] = useState("date-asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [tripsView, setTripsView] = useState("list"); // "list" | "map"
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
    return status === 'upcoming' || status === 'happening now' || /** @type {string} */ (status) === 'almost soldout';
  });

  const filteredTrips = React.useMemo(() => {
    const tripsInCurrentMonth = activeTrips.filter((trip) => {
      const tripDate = toZonedTime(new Date(trip.start_date), ATHENS_TIMEZONE);
      return tripDate.getMonth() === currentDate.getMonth() &&
        tripDate.getFullYear() === currentDate.getFullYear();
    });
    return tripsInCurrentMonth.filter((trip) => {
    if (filters.difficulty !== "all" && trip.difficulty !== filters.difficulty) {
      return false;
    }

    const effectivePrice = trip.pricing_options?.length > 0
      ? Math.min(...trip.pricing_options.map(o => o.price))
      : (trip.price || 0);
    if (filters.minPrice && effectivePrice < parseFloat(filters.minPrice)) {
      return false;
    }
    if (filters.maxPrice && effectivePrice > parseFloat(filters.maxPrice)) {
      return false;
    }

    if (filters.tags.length > 0) {
      const tripTags = trip.tags || [];
      const hasMatchingTag = filters.tags.some((tag) => tripTags.includes(tag));
      if (!hasMatchingTag) return false;
    }

    if (filters.verifiedOnly) {
      const organizer = trip.organizer_code ? organizerMap[trip.organizer_code] : null;
      if (!organizer || !organizer.is_verified) {
        return false;
      }
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      // Strip HTML tags from description before searching
      const plainDescription = trip.description
        ? trip.description.replace(/<[^>]*>/g, ' ')
        : '';
      const matchesSearch =
        trip.title?.toLowerCase().includes(query) ||
        trip.location?.toLowerCase().includes(query) ||
        plainDescription.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    return true;
    });
  }, [activeTrips, currentDate, filters, organizerMap]);

  // Sort trips based on selected sort option
  const sortedTrips = React.useMemo(() => {
    const sorted = [...filteredTrips];
    
    switch (sortBy) {
      case "date-asc":
        return sorted.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
      case "date-desc":
        return sorted.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
      case "price-asc":
        return sorted.sort((a, b) => (getLowestPrice(a) ?? 0) - (getLowestPrice(b) ?? 0));
      case "price-desc":
        return sorted.sort((a, b) => (getLowestPrice(b) ?? 0) - (getLowestPrice(a) ?? 0));
      case "location":
        return sorted.sort((a, b) => (a.location || "").localeCompare(b.location || ""));
      case "difficulty": {
        const difficultyOrder = { easy: 1, moderate: 2, challenging: 3, difficult: 4 };
        return sorted.sort((a, b) => (difficultyOrder[a.difficulty] || 0) - (difficultyOrder[b.difficulty] || 0));
      }
      default:
        return sorted;
    }
  }, [filteredTrips, sortBy]);

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
  const totalPages = selectedDate ? 1 : Math.ceil(sortedTrips.length / tripsPerPage);
  const startIndex = (currentPage - 1) * tripsPerPage;
  const endIndex = startIndex + tripsPerPage;
  
  // Find promoted trips in the current month
  const promotedTrip = React.useMemo(() => {
    if (!activeTrips.length) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inMonth = activeTrips.filter(trip => {
      const d = new Date(trip.start_date);
      return d >= today && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });
    if (!inMonth.length) return null;
    // Find trips marked as promoted
    const promoted = inMonth.filter(trip => trip.is_promoted === true);
    if (!promoted.length) return null;
    // Return the first promoted trip (or you could randomize here)
    return promoted[0];
  }, [activeTrips, currentDate]);

  const displayTrips = React.useMemo(() => {
    if (selectedDate) return selectedDayTrips;
    const page = sortedTrips.slice(startIndex, endIndex);
    if (currentPage === 1 && promotedTrip) {
      const withoutPromoted = page.filter(t => t.id !== promotedTrip.id);
      return [promotedTrip, ...withoutPromoted];
    }
    return page;
  }, [selectedDate, selectedDayTrips, sortedTrips, startIndex, endIndex, currentPage, promotedTrip]);

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
    <>
    <StructuredData data={calendarBreadcrumb} />
    <PullToRefresh onRefresh={handleRefresh}>
      <PageWrapper>
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

        <div className="flex gap-3 mb-6 items-center flex-wrap">
          <TripFilters filters={filters} onFilterChange={setFilters} />

          <div className="bg-emerald-100 text-emerald-800 px-4 py-2.5 text-sm font-medium rounded-md border border-emerald-200 inline-flex items-center justify-center h-9">
            {sortedTrips.length} {language === 'el' ? 'εκδρομές' : 'trips'}
          </div>

          {hasActiveFilters &&
          <Button
            variant="outline"
            onClick={handleClearAll}
            className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 min-h-[44px]"
            aria-label={t('filters.clear')}
          >
              <X className="w-4 h-4 mr-2" aria-hidden="true" />
              {t('filters.clear')}
            </Button>
          }
        </div>

        <div className="flex flex-col gap-8">
          <div className="grid lg:grid-cols-2 gap-6 items-stretch">
            <div className="flex flex-col">
              <CalendarGrid
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                trips={sortedTrips}
                onDayClick={handleDayClick}
                selectedDate={selectedDate} />
            </div>

            <div className="flex flex-col">
              <PromotedTrip trips={activeTrips} currentDate={currentDate} />
            </div>
          </div>

          <div ref={tripsListRef}>
            {/* View switcher header */}
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-lg font-semibold text-stone-800">
                {selectedDate
                  ? (language === 'el' ? 'Εκδρομές της ημέρας' : 'Trips on this day')
                  : (language === 'el' ? 'Επερχόμενες Εκδρομές' : 'Upcoming Trips')}
              </h1>
              <div className="flex items-center gap-1 bg-stone-100 rounded-lg p-1" role="tablist" aria-label="Trip view mode">
                <button
                  role="tab"
                  aria-selected={tripsView === "list"}
                  aria-label={language === 'el' ? 'Προβολή λίστας' : 'List view'}
                  onClick={() => setTripsView("list")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    tripsView === "list"
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-stone-500 hover:text-stone-700"
                  }`}
                >
                  <List className="w-4 h-4" aria-hidden="true" />
                  {language === 'el' ? 'Λίστα' : 'List'}
                </button>
                <button
                  role="tab"
                  aria-selected={tripsView === "map"}
                  aria-label={language === 'el' ? 'Προβολή χάρτη' : 'Map view'}
                  onClick={() => setTripsView("map")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    tripsView === "map"
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-stone-500 hover:text-stone-700"
                  }`}
                >
                  <Map className="w-4 h-4" aria-hidden="true" />
                  {language === 'el' ? 'Χάρτης' : 'Map'}
                </button>
              </div>
            </div>

            {tripsView === "map" ? (
              <LazyTripsMap
                trips={selectedDate ? selectedDayTrips : filteredTrips}
                organizerMap={organizerMap}
              />
            ) : isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" />
              </div>
            ) : (
            <>
                <TripsList trips={selectedDate ? displayTrips : displayTrips.filter(t => t.id !== promotedTrip?.id)} selectedDate={selectedDate} promotedTripId={null} />
                {!selectedDate && totalPages > 1 &&
              <div className="flex justify-center items-center gap-2 mt-8">
                    <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 min-h-[44px]"
                  aria-label={language === 'el' ? 'Προηγούμενη σελίδα' : 'Previous page'}
                >
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
                              className={currentPage === pageNum ? "bg-emerald-600 hover:bg-emerald-700 min-h-[44px] min-w-[44px]" : "border-emerald-300 text-emerald-700 hover:bg-emerald-50 min-h-[44px] min-w-[44px]"}
                              size="sm"
                              aria-label={language === 'el' ? `Σελίδα ${pageNum}` : `Page ${pageNum}`}
                              aria-current={currentPage === pageNum ? 'page' : undefined}
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
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 min-h-[44px]"
                  aria-label={language === 'el' ? 'Επόμενη σελίδα' : 'Next page'}
                >
                      {language === 'el' ? 'Επόμενη' : 'Next'}
                    </Button>
                  </div>
                  }
                  </>
                  )}
          </div>
        </div>
      </PageWrapper>
    </PullToRefresh>
    </>
  );
}