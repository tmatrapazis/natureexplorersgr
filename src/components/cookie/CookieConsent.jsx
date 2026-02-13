import React, { useState, useEffect } from 'react';
import CookieConsentBanner from './CookieConsentBanner';
import CookiePreferencesModal from './CookiePreferencesModal';
import CookieSettingsButton from './CookieSettingsButton';

const STORAGE_KEY = 'cookie_consent_preferences';

const defaultPreferences = {
  necessary: true, // Always true, cannot be disabled
  analytics: false,
  marketing: false,
};

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [hasConsented, setHasConsented] = useState(false);

  useEffect(() => {
    // Check if user has already given consent
    const savedPreferences = localStorage.getItem(STORAGE_KEY);
    
    if (savedPreferences) {
      const parsed = JSON.parse(savedPreferences);
      setPreferences(parsed);
      setHasConsented(true);
      loadScriptsBasedOnConsent(parsed);
    } else {
      // Show banner if no consent has been given
      setShowBanner(true);
    }
  }, []);

  const savePreferences = (prefs) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    setPreferences(prefs);
    setHasConsented(true);
    loadScriptsBasedOnConsent(prefs);
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
    };
    savePreferences(allAccepted);
    setShowBanner(false);
  };

  const handleRejectAll = () => {
    const allRejected = {
      necessary: true, // Cannot be disabled
      analytics: false,
      marketing: false,
    };
    savePreferences(allRejected);
    setShowBanner(false);
  };

  const handleCustomize = () => {
    setShowBanner(false);
    setShowPreferences(true);
  };

  const handleSaveCustom = (customPrefs) => {
    savePreferences(customPrefs);
    setShowPreferences(false);
  };

  const handleOpenSettings = () => {
    setShowPreferences(true);
  };

  const loadScriptsBasedOnConsent = (prefs) => {
    // Analytics scripts
    if (prefs.analytics) {
      // Load Google Analytics or other analytics scripts
      console.log('[Cookie Consent] Analytics enabled');
      // Example: Load GA4
      // window.gtag && window.gtag('consent', 'update', {
      //   'analytics_storage': 'granted'
      // });
    } else {
      console.log('[Cookie Consent] Analytics disabled');
    }

    // Marketing scripts
    if (prefs.marketing) {
      // Load marketing/advertising scripts
      console.log('[Cookie Consent] Marketing enabled');
      // Example: Load Facebook Pixel, Google Ads, etc.
    } else {
      console.log('[Cookie Consent] Marketing disabled');
    }
  };

  return (
    <>
      {showBanner && (
        <CookieConsentBanner
          onAcceptAll={handleAcceptAll}
          onRejectAll={handleRejectAll}
          onCustomize={handleCustomize}
        />
      )}

      {showPreferences && (
        <CookiePreferencesModal
          preferences={preferences}
          onSave={handleSaveCustom}
          onClose={() => setShowPreferences(false)}
        />
      )}

      {hasConsented && !showPreferences && (
        <CookieSettingsButton onClick={handleOpenSettings} />
      )}
    </>
  );
}