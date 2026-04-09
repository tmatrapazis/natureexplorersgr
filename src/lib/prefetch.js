/**
 * prefetch.js — proactive data prefetching helpers.
 *
 * Call these during idle time (e.g. on mount or hover) so that the target
 * page renders instantly instead of showing a loading spinner.
 */
import { queryClientInstance } from './query-client';
import { HikingTrip, Organizer } from '@/api/db';

const STALE_TIME = 5 * 60 * 1000; // matches global default

/**
 * Prefetch Calendar page data (trips + organizers).
 * Call from Home.jsx on mount so Calendar renders instantly.
 */
export function prefetchCalendarData() {
  queryClientInstance.prefetchQuery({
    queryKey: ['hiking-trips'],
    queryFn: () => HikingTrip.list('start_date'),
    staleTime: STALE_TIME,
  });
  queryClientInstance.prefetchQuery({
    queryKey: ['organizers-calendar'],
    queryFn: () => Organizer.list(),
    staleTime: STALE_TIME,
  });
}

/**
 * Prefetch a single trip + its organizer.
 * Call on trip card hover/pointer-enter so TripDetails renders instantly.
 */
export function prefetchTripDetails(tripId) {
  if (!tripId) return;
  queryClientInstance.prefetchQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      const trips = await HikingTrip.filter({ id: tripId });
      const trip = trips[0];
      if (!trip) return { trip: null, organizer: null };
      const organizers = await Organizer.filter({ organizer_code: trip.organizer_code });
      return { trip, organizer: organizers[0] ?? null };
    },
    staleTime: STALE_TIME,
  });
}
