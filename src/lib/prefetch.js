/**
 * prefetch.js — proactive data prefetching helpers.
 *
 * Call these during idle time (e.g. on mount or hover) so that the target
 * page renders instantly instead of showing a loading spinner.
 */
import { queryClientInstance } from './query-client';
import { HikingTrip, Organizer } from '@/api/db';

const STALE_TIME = 60 * 1000; // matches global default

/**
 * Prefetch Calendar page data (trips + organizers).
 */
export function prefetchCalendarData() {
  queryClientInstance.prefetchQuery({
    queryKey: ['hiking-trips'],
    queryFn: () => HikingTrip.list('start_date'),
    staleTime: STALE_TIME,
  });
  queryClientInstance.prefetchQuery({
    queryKey: ['organizers'],
    queryFn: () => Organizer.list(),
    staleTime: STALE_TIME,
  });
}

/**
 * Prefetch OrganizersList page data.
 */
export function prefetchOrganizersData() {
  queryClientInstance.prefetchQuery({
    queryKey: ['organizers'],
    queryFn: () => Organizer.list(),
    staleTime: STALE_TIME,
  });
  queryClientInstance.prefetchQuery({
    queryKey: ['hiking-trips'],
    queryFn: () => HikingTrip.list('start_date'),
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
      return trips[0] ?? null;
    },
    staleTime: STALE_TIME,
  });
  // Organizers are prefetched via the shared cache — no separate call needed
}
