import React, { useState, useRef, useEffect } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

export default function PullToRefresh({ onRefresh, children }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canPull, setCanPull] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef(null);
  
  const threshold = 80;
  const maxPull = 120;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e) => {
      if (container.scrollTop === 0) {
        setCanPull(true);
        startY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e) => {
      if (!canPull || isRefreshing) return;
      
      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, currentY - startY.current);
      
      if (distance > 0 && container.scrollTop === 0) {
        e.preventDefault();
        setPullDistance(Math.min(distance, maxPull));
      }
    };

    const handleTouchEnd = async () => {
      if (!canPull || isRefreshing) return;
      
      if (pullDistance >= threshold) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } catch (error) {
          console.error('Refresh error:', error);
        } finally {
          setTimeout(() => {
            setIsRefreshing(false);
            setPullDistance(0);
          }, 500);
        }
      } else {
        setPullDistance(0);
      }
      setCanPull(false);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [canPull, isRefreshing, pullDistance, onRefresh]);

  const rotation = isRefreshing ? 360 : (pullDistance / threshold) * 360;
  const opacity = Math.min(pullDistance / threshold, 1);

  return (
    <div ref={containerRef} className="relative h-full overflow-auto">
      <div 
        className="absolute top-0 left-0 right-0 flex items-center justify-center transition-transform"
        style={{ 
          transform: `translateY(${isRefreshing ? '60px' : `${pullDistance}px`})`,
          height: '60px',
          opacity: opacity
        }}
      >
        <div className="bg-background rounded-full p-2 shadow-lg">
          {isRefreshing ? (
            <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
          ) : (
            <RefreshCw 
              className="w-6 h-6 text-emerald-600 transition-transform" 
              style={{ transform: `rotate(${rotation}deg)` }}
            />
          )}
        </div>
      </div>
      <div style={{ paddingTop: isRefreshing ? '60px' : '0' }}>
        {children}
      </div>
    </div>
  );
}