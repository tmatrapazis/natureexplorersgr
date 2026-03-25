import React, { Suspense, lazy } from 'react';
import { Mountain } from 'lucide-react';

const GreekRefugesMapComponent = lazy(() => import('../refuges/GreekRefugesMap'));

export default function LazyGreekRefugesMap(props) {
  return (
    <div className="min-h-[300px] md:min-h-[500px]" style={{ willChange: 'contents' }}>
      <Suspense
        fallback={
          <div className="h-[300px] md:h-[500px] w-full max-w-full bg-muted/30 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Mountain className="w-8 h-8 text-emerald-600 animate-pulse mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading map...</p>
            </div>
          </div>
        }
      >
        <GreekRefugesMapComponent {...props} />
      </Suspense>
    </div>
  );
}