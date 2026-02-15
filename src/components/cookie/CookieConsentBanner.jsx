import React from 'react';
import { Button } from '@/components/ui/button';
import { Cookie } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function CookieConsentBanner({ onAcceptAll, onRejectAll, onCustomize }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-4">
      <div className="bg-background border border-border rounded-lg shadow-2xl max-w-2xl w-full p-6 md:p-8 animate-in slide-in-from-bottom-4 md:slide-in-from-bottom-0">
        <div className="flex items-start gap-4 mb-4">
          <div className="bg-primary/10 p-3 rounded-lg shrink-0">
            <Cookie className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">We Value Your Privacy</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We use cookies to improve your experience on our site, analyze site usage, and assist in our marketing efforts. 
              By clicking "Accept All", you consent to the use of all cookies. You can also customize your preferences or reject non-essential cookies.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-6">
          <Link 
            to={createPageUrl('PrivacyPolicy')}
            className="underline hover:text-foreground transition-colors"
          >
            Privacy Policy
          </Link>
          <span>•</span>
          <Link 
            to={createPageUrl('CookiePolicy')}
            className="underline hover:text-foreground transition-colors"
          >
            Cookie Policy
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={onAcceptAll} 
            className="flex-1 sm:flex-none sm:min-w-[140px]"
            size="lg"
          >
            Accept All
          </Button>
          
          <Button 
            onClick={onRejectAll} 
            variant="outline"
            className="flex-1 sm:flex-none sm:min-w-[140px] border-2"
            size="lg"
          >
            Reject All
          </Button>
          
          <Button 
            onClick={onCustomize} 
            variant="ghost"
            className="flex-1 sm:flex-none sm:min-w-[140px]"
            size="lg"
          >
            Customize
          </Button>
        </div>
      </div>
    </div>
  );
}