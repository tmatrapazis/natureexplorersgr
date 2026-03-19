import React, { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

const TripsMap = lazy(() => import('../calendar/TripsMap'));

/**
 * Code-split wrapper for the TripsMap calendar component (uses Leaflet + MarkerCluster).
 * Lazy-loads heavy map dependencies only when the user switches to map view.
 */
export default function LazyTripsMap({ trips, organizerMap }) {
  return (
    <Suspense
      fallback={
        <div className="rounded-xl overflow-hidden border border-stone-200 shadow-sm">
          <div className="h-[420px] flex items-center justify-center bg-stone-50">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-stone-400 mx-auto mb-2" />
              <p className="text-sm text-stone-500">Loading map...</p>
            </div>
          </div>
        </div>
      }
    >
      <TripsMap trips={trips} organizerMap={organizerMap} />
    </Suspense>
  );
}