import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

/**
 * PullToRefresh
 *
 * Attaches touch listeners to the nearest `.page-transition-layer` ancestor
 * (the animated scroll host managed by Layout.jsx) rather than creating its own
 * overflow container.  This preserves TabNavigationContext's scroll-position
 * save/restore, which queries `.page-transition-layer.scrollTop`.
 *
 * Props:
 *   onRefresh  — async () => void  called when the user pulls past the threshold
 *   children   — React nodes       page content rendered inside a relative wrapper
 */
export default function PullToRefresh({ onRefresh, children }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mutable refs — avoids stale-closure issues inside event handlers
  const canPullRef   = useRef(false);
  const startYRef    = useRef(0);
  const distanceRef  = useRef(0);
  const refreshingRef = useRef(false);

  // The wrapper we use to find the scroll host on mount
  const wrapperRef = useRef(null);

  const THRESHOLD = 80;  // px to trigger refresh
  const MAX_PULL  = 120; // px clamped visual max

  // Keep refreshingRef in sync
  useEffect(() => { refreshingRef.current = isRefreshing; }, [isRefreshing]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    refreshingRef.current = true;
    try {
      await onRefresh();
    } catch {
      // Swallow — callers toast on error themselves
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
        refreshingRef.current = false;
        setPullDistance(0);
        distanceRef.current = 0;
      }, 500);
    }
  }, [onRefresh]);

  useEffect(() => {
    // Walk up the DOM to find the scroll host; fall back to the wrapper itself.
    const wrapper = wrapperRef.current;
    const scrollEl = wrapper?.closest('.page-transition-layer') ?? wrapper;
    if (!scrollEl) return;

    const handleTouchStart = (e) => {
      if (refreshingRef.current) return;
      if (scrollEl.scrollTop === 0) {
        canPullRef.current = true;
        startYRef.current  = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e) => {
      if (!canPullRef.current || refreshingRef.current) return;
      const dy = Math.max(0, e.touches[0].clientY - startYRef.current);
      if (dy > 0 && scrollEl.scrollTop === 0) {
        e.preventDefault();
        const clamped = Math.min(dy, MAX_PULL);
        distanceRef.current = clamped;
        setPullDistance(clamped);
      }
    };

    const handleTouchEnd = () => {
      if (!canPullRef.current || refreshingRef.current) return;
      canPullRef.current = false;
      if (distanceRef.current >= THRESHOLD) {
        handleRefresh();
      } else {
        setPullDistance(0);
        distanceRef.current = 0;
      }
    };

    scrollEl.addEventListener('touchstart', handleTouchStart, { passive: true });
    scrollEl.addEventListener('touchmove',  handleTouchMove,  { passive: false });
    scrollEl.addEventListener('touchend',   handleTouchEnd);

    return () => {
      scrollEl.removeEventListener('touchstart', handleTouchStart);
      scrollEl.removeEventListener('touchmove',  handleTouchMove);
      scrollEl.removeEventListener('touchend',   handleTouchEnd);
    };
  }, [handleRefresh]); // stable: handleRefresh only changes if onRefresh changes

  const rotation = isRefreshing ? 360 : (pullDistance / THRESHOLD) * 360;
  const opacity  = Math.min(pullDistance / THRESHOLD, 1);

  return (
    <div ref={wrapperRef} className="relative">
      {/* Pull indicator — slides down with the pull gesture */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 right-0 flex items-center justify-center pointer-events-none"
        style={{
          transform: `translateY(${isRefreshing ? '60px' : `${pullDistance}px`})`,
          height:    '60px',
          opacity,
          zIndex:    10,
          transition: isRefreshing ? 'none' : undefined,
        }}
      >
        <div className="bg-background rounded-full p-2 shadow-lg">
          {isRefreshing ? (
            <Loader2 className="w-6 h-6 text-[#0c281c] animate-spin" />
          ) : (
            <RefreshCw
              className="w-6 h-6 text-[#0c281c]"
              style={{ transform: `rotate(${rotation}deg)` }}
            />
          )}
        </div>
      </div>

      {/* Content — pushed down when refreshing to make room for the indicator */}
      <div style={{ paddingTop: isRefreshing ? '60px' : '0', transition: 'padding-top 0.2s ease' }}>
        {children}
      </div>
    </div>
  );
}
