import React, { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

const LocationPicker = lazy(() => import('../trips/LocationPicker'));

/**
 * Code-split wrapper for LocationPicker (which uses Leaflet)
 * Lazy-loads the heavy Leaflet library only when needed
 */
export default function LazyLocationPicker({ latitude, longitude, language, onLocationChange }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-[300px] bg-stone-50 rounded-md border border-stone-200">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-stone-400 mx-auto mb-2" />
            <p className="text-sm text-stone-500">
              {language === 'el' ? 'Φόρτωση χάρτη...' : 'Loading map...'}
            </p>
          </div>
        </div>
      }
    >
      <LocationPicker
        latitude={latitude}
        longitude={longitude}
        language={language}
        onLocationChange={onLocationChange}
      />
    </Suspense>
  );
}