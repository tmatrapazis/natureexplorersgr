import React from "react";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";

import { trackEvent } from "../analytics/GoogleAnalytics";
import { formatDateRange } from "../helpers/dateHelpers";

export default function ShareButton({ trip, language, className = "" }) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || ('ontouchstart' in window && navigator.maxTouchPoints > 0));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const shareUrl = window.location.href;
  const shareText = language === 'el'
    ? `Γεια! Βρήκα αυτή την υπέροχη πεζοπορία: ${trip.title} στις ${formatDateRange(trip.start_date, trip.end_date)}. Δες την: ${shareUrl}`
    : `Hey! Found this awesome hike: ${trip.title} on ${formatDateRange(trip.start_date, trip.end_date)}. Check it out: ${shareUrl}`;

  const handleNativeShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: trip.title,
          text: shareText,
          url: shareUrl,
        });
        trackEvent('share_success', {
          event_category: 'Engagement',
          event_label: trip.title,
          trip_id: trip.id,
          method: 'native',
        });
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Share failed:', error);
      }
    }
  };



  // Mobile: use native share
  if (isMobile && navigator.share) {
    return (
      <Button
        onClick={handleNativeShare}
        className={`fixed bottom-6 right-6 z-50 shadow-lg bg-emerald-600 hover:bg-emerald-700 h-14 w-14 rounded-full ${className}`}
        size="icon"
      >
        <Share2 className="w-6 h-6" />
      </Button>
    );
  }

  // Desktop: don't show share button
  return null;
}