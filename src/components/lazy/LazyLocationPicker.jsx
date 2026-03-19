import React, { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

const LocationPicker = lazy(() => import('../trips/LocationPicker'));

const LoadingFallback = () => (
  <div className="h-[400px] flex items-center justify-center bg-stone-50 rounded-lg border border-stone-200">
    <div className="text-center">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
      <p className="text-sm text-stone-500">Loading map...</p>
    </div>
  </div>
);

export default function LazyLocationPicker(props) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LocationPicker {...props} />
    </Suspense>
  );
}