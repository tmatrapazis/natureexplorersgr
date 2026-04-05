import React, { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';
import { useInView } from '@/lib/useInView';

const LocationPicker = lazy(() => import('../trips/LocationPicker'));

const LoadingFallback = () => (
  <div className="h-[400px] flex items-center justify-center bg-muted/30 rounded-lg border border-border">
    <div className="text-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#0c281c] mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">Loading map...</p>
    </div>
  </div>
);

/**
 * Code-split wrapper for the LocationPicker (uses Leaflet click-to-place).
 *
 * Two-stage lazy loading:
 * 1. React.lazy: Leaflet bundle only downloaded when component first mounts.
 * 2. IntersectionObserver: uses a tighter 100px margin since the picker is
 *    always in a form — it will almost always be in view quickly, so we don't
 *    need to pre-fetch far in advance.
 */
export default function LazyLocationPicker(props) {
  const [containerRef, isInView] = useInView('100px 0px');

  return (
    <div
      ref={containerRef}
      className="min-h-[400px]"
      style={{ willChange: 'contents' }}
    >
      {isInView ? (
        <Suspense fallback={<LoadingFallback />}>
          <LocationPicker {...props} />
        </Suspense>
      ) : (
        <LoadingFallback />
      )}
    </div>
  );
}
