import React, { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

const TripLocationMap = lazy(() => import('../trips/TripLocationMap'));

/**
 * Code-split wrapper for TripLocationMap (uses Leaflet).
 * Lazy-loads the heavy Leaflet library only when needed.
 */
export default function LazyTripLocationMap({ trip }) {
  const hasCoordinates = trip?.latitude && trip?.longitude;

  if (!hasCoordinates) {
    return (
      <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground text-sm">{trip?.location}</p>
      </div>
    );
  }

  return (
    <div className="min-h-[16rem]" style={{ willChange: 'contents' }}>
      <Suspense
        fallback={
          <div className="w-full h-64 bg-muted/30 rounded-lg border border-border flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading map...</p>
            </div>
          </div>
        }
      >
        <TripLocationMap trip={trip} />
      </Suspense>
    </div>
  );
}