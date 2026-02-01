import React from "react";
import { Button } from "@/components/ui/button";
import { Share2, MessageCircle, Mail, Link as LinkIcon, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { trackEvent } from "../analytics/GoogleAnalytics";
import { formatDateRange } from "../helpers/dateHelpers";

export default function ShareButton({ trip, language, className = "" }) {
  const [isMobile, setIsMobile] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

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

  const handleWhatsAppShare = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
    trackEvent('share_success', {
      event_category: 'Engagement',
      event_label: trip.title,
      trip_id: trip.id,
      method: 'whatsapp',
    });
  };

  const handleMessengerShare = () => {
    const url = `https://www.facebook.com/dialog/send?link=${encodeURIComponent(shareUrl)}&app_id=YOUR_APP_ID&redirect_uri=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
    trackEvent('share_success', {
      event_category: 'Engagement',
      event_label: trip.title,
      trip_id: trip.id,
      method: 'messenger',
    });
  };

  const handleEmailShare = () => {
    const subject = language === 'el' ? `Δες αυτή την πεζοπορία: ${trip.title}` : `Check out this hike: ${trip.title}`;
    const body = shareText;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    trackEvent('share_success', {
      event_category: 'Engagement',
      event_label: trip.title,
      trip_id: trip.id,
      method: 'email',
    });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      trackEvent('share_success', {
        event_category: 'Engagement',
        event_label: trip.title,
        trip_id: trip.id,
        method: 'copy_link',
      });
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };



  // Mobile: use native share
  if (isMobile && navigator.share) {
    return (
      <Button
        onClick={handleNativeShare}
        className={`fixed bottom-6 right-6 z-50 shadow-lg bg-emerald-600 hover:bg-emerald-700 h-14 w-14 rounded-full ${className}`}
        size="icon"
        aria-label="Share trip"
      >
        <Share2 className="w-6 h-6" />
      </Button>
    );
  }

  // Desktop: dropdown with sharing options
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={className}
          aria-label="Share trip"
        >
          <Share2 className="w-4 h-4 mr-2" />
          {language === 'el' ? 'Κοινοποίηση' : 'Share'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleWhatsAppShare} className="cursor-pointer">
          <MessageCircle className="w-4 h-4 mr-2 text-green-600" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleMessengerShare} className="cursor-pointer">
          <MessageCircle className="w-4 h-4 mr-2 text-blue-600" />
          Facebook Messenger
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleEmailShare} className="cursor-pointer">
          <Mail className="w-4 h-4 mr-2 text-stone-600" />
          Email
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2 text-green-600" />
              {language === 'el' ? 'Αντιγράφηκε!' : 'Copied!'}
            </>
          ) : (
            <>
              <LinkIcon className="w-4 h-4 mr-2 text-stone-600" />
              {language === 'el' ? 'Αντιγραφή Συνδέσμου' : 'Copy Link'}
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}