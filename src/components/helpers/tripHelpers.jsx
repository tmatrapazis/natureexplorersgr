import { isBefore, isAfter, isWithinInterval, startOfDay, endOfDay } from "date-fns";

/**
 * Parse a YYYY-MM-DD date string as local midnight (avoids UTC shift off-by-one bug)
 */
const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/**
 * Calculate the computed status of a trip based on its dates and status
 */
export const getComputedTripStatus = (trip) => {
  if (!trip || trip.status === 'cancelled') return 'cancelled';
  if (!trip.start_date) return 'upcoming';

  const today = startOfDay(new Date());
  const startDate = startOfDay(parseLocalDate(trip.start_date));
  const endDate = trip.end_date ? endOfDay(parseLocalDate(trip.end_date)) : endOfDay(parseLocalDate(trip.start_date));

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 'upcoming';

  if (isBefore(endDate, today)) return 'completed';
  if (isWithinInterval(today, { start: startDate, end: endDate })) return 'happening now';
  if (isAfter(startDate, today)) return 'upcoming';
  
  return 'completed';
};

/**
 * Get color classes for trip status badges
 */
export const statusColors = {
  upcoming: "bg-blue-100 text-blue-800",
  "happening now": "bg-green-100 text-green-800 animate-pulse",
  completed: "bg-stone-100 text-stone-800",
  cancelled: "bg-red-100 text-red-800",
};

/**
 * Get color classes for difficulty badges
 */
export const difficultyColors = {
  easy: "bg-green-100 text-green-800 border-green-200",
  moderate: "bg-yellow-100 text-yellow-800 border-yellow-200",
  challenging: "bg-orange-100 text-orange-800 border-orange-200",
  difficult: "bg-red-100 text-red-800 border-red-200"
};

/**
 * Get availability color based on percentage
 */
export const getAvailabilityColor = (percentageAvailable) => {
  if (percentageAvailable === 0) return "bg-red-500";
  if (percentageAvailable <= 10) return "bg-orange-500";
  if (percentageAvailable <= 30) return "bg-yellow-500";
  return "bg-green-500";
};

/**
 * Get availability text label based on percentage
 */
export const getAvailabilityLabel = (percentageAvailable) => {
  if (percentageAvailable === 0) return "Full";
  if (percentageAvailable <= 10) return "Low";
  if (percentageAvailable <= 30) return "Limited";
  return "Available";
};