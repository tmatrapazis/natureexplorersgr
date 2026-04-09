import React, { Suspense, lazy } from 'react';
import { Mountain } from 'lucide-react';
import { useInView } from '@/lib/useInView';

const GreekRefugesMapComponent = lazy(() => import('../refuges/GreekRefugesMap'));

const MapFallback = () => (
  <div className="h-[300px] md:h-[500px] w-full max-w-full bg-muted/30 rounded-lg flex items-center justify-center">
    <div className="text-center">
      <Mountain className="w-8 h-8 text-brand-dark animate-pulse mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">Loading map...</p>
    </div>
  </div>
);

/**
 * Code-split wrapper for GreekRefugesMap (uses Leaflet + clustering).
 *
 * Two-stage lazy loading:
 * 1. React.lazy: Leaflet bundle only downloaded when component first mounts.
 * 2. IntersectionObserver: the Suspense tree is deferred until the map container
 *    scrolls within 300px of the viewport — avoids a heavy Leaflet import on
 *    every GreekRefuges page load when the user hasn't scrolled to the map yet.
 */
export default function LazyGreekRefugesMap(props) {
  const [containerRef, isInView] = useInView('300px 0px');

  return (
    <div
      ref={containerRef}
      className="min-h-[300px] md:min-h-[500px]"
      style={{ willChange: 'contents' }}
    >
      {isInView ? (
        <Suspense fallback={<MapFallback />}>
          <GreekRefugesMapComponent {...props} />
        </Suspense>
      ) : (
        <MapFallback />
      )}
    </div>
  );
}
