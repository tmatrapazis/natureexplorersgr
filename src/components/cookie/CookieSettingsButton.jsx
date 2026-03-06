import React from 'react';
import { Button } from '@/components/ui/button';
import { Cookie } from 'lucide-react';

export default function CookieSettingsButton({ onClick }) {
  return (
    <Button
      onClick={onClick}
      data-cookie-settings-button
      size="icon"
      className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-40 h-12 w-12 rounded-full shadow-lg hover:scale-110 transition-transform"
      aria-label="Cookie Settings"
    >
      <Cookie className="w-5 h-5" />
    </Button>
  );
}