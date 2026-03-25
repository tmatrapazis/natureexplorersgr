import React, { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { useInView } from '@/lib/useInView';

const TripLocationMap = lazy(() => import('../trips/TripLocationMap'));

const MapFallback = () => (
  <div className="w-full h-64 bg-muted/30 rounded-lg border border-border flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">Loading map...</p>
    </div>
  </div>
);

/**
 * Code-split wrapper for TripLocationMap (uses Leaflet).
 *
 * Two-stage lazy loading:
 * 1. React.lazy: Leaflet bundle only downloaded when component first mounts.
 * 2. IntersectionObserver: the Suspense tree is deferred until the map container
 *    is within 250px of the viewport, avoiding unnecessary bundle fetches when
 *    TripDetails loads and the map is below the fold.
 */
export default function LazyTripLocationMap({ trip }) {
  const [containerRef, isInView] = useInView('250px 0px');
  const hasCoordinates = trip?.latitude && trip?.longitude;

  if (!hasCoordinates) {
    return (
      <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground text-sm">{trip?.location}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="min-h-[16rem]"
      style={{ willChange: 'contents' }}
    >
      {isInView ? (
        <Suspense fallback={<MapFallback />}>
          <TripLocationMap trip={trip} />
        </Suspense>
      ) : (
        <MapFallback />
      )}
    </div>
  );
}
