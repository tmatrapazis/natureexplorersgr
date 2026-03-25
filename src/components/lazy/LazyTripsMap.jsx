import React, { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { useInView } from '@/lib/useInView';

const TripsMap = lazy(() => import('../calendar/TripsMap'));

const MapFallback = () => (
  <div className="rounded-xl overflow-hidden border border-border shadow-sm">
    <div className="h-[420px] flex items-center justify-center bg-muted/30">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    </div>
  </div>
);

/**
 * Code-split wrapper for the TripsMap calendar component (uses Leaflet + MarkerCluster).
 *
 * Two-stage lazy loading:
 * 1. React.lazy + Suspense: the Leaflet bundle is only downloaded on first render.
 * 2. IntersectionObserver (useInView): the Suspense tree — and therefore the network
 *    request — is deferred until the container is within 300px of the viewport.
 *    Maps that start below the fold (Calendar map-view) never block page load.
 */
export default function LazyTripsMap({ trips, organizerMap }) {
  const [containerRef, isInView] = useInView('300px 0px');

  return (
    <div
      ref={containerRef}
      className="min-h-[420px]"
      style={{ willChange: 'contents' }}
    >
      {isInView ? (
        <Suspense fallback={<MapFallback />}>
          <TripsMap trips={trips} organizerMap={organizerMap} />
        </Suspense>
      ) : (
        <MapFallback />
      )}
    </div>
  );
}
