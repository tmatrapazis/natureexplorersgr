import React from "react";
import { Button } from "@/components/ui/button";
import { Share2, MessageCircle, Mail, Link as LinkIcon, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ShareGuideButton({ guide, language, className = "" }) {
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
    ? `Γεια! Αυτό είναι το επαγγελματικό μου προφίλ: ${shareUrl}`
    : `Hey! This is my professional profile: ${shareUrl}`;

  const handleNativeShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: guide.full_name,
          text: shareText,
          url: shareUrl,
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
  };

  const handleMessengerShare = () => {
    const url = `https://www.facebook.com/dialog/send?link=${encodeURIComponent(shareUrl)}&app_id=YOUR_APP_ID&redirect_uri=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
  };

  const handleEmailShare = () => {
    const subject = language === 'el' 
      ? `Δες το προφίλ μου: ${guide.full_name}` 
      : `Check out my profile: ${guide.full_name}`;
    const body = shareText;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  // Mobile: use native share (sticky at bottom)
  if (isMobile && navigator.share) {
    return (
      <Button
        onClick={handleNativeShare}
        className={`fixed bottom-6 right-6 z-50 shadow-lg bg-emerald-600 hover:bg-emerald-700 min-h-[56px] min-w-[56px] rounded-full ${className}`}
        size="icon"
        aria-label={language === 'el' ? 'Κοινοποίηση προφίλ' : 'Share profile'}
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
          className={`min-h-[44px] ${className}`}
          aria-label={language === 'el' ? 'Κοινοποίηση προφίλ οδηγού' : 'Share guide profile'}
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
          <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
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
              <LinkIcon className="w-4 h-4 mr-2 text-muted-foreground" />
              {language === 'el' ? 'Αντιγραφή Συνδέσμου' : 'Copy Link'}
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}