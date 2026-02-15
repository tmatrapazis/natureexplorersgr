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

// Safe localStorage parser with fallback
const getSavedPreferences = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    
    const parsed = JSON.parse(saved);
    // Validate structure
    if (typeof parsed === 'object' && parsed !== null) {
      return {
        necessary: true, // Always enforce
        analytics: !!parsed.analytics,
        marketing: !!parsed.marketing,
      };
    }
    return null;
  } catch (error) {
    console.warn('[CookieConsent] Failed to parse saved preferences, resetting:', error);
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export default function CookieConsent({ onConsentChange }) {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [hasConsented, setHasConsented] = useState(false);

  useEffect(() => {
    // Check if user has already given consent
    const savedPreferences = getSavedPreferences();
    
    if (savedPreferences) {
      setPreferences(savedPreferences);
      setHasConsented(true);
      if (onConsentChange) {
        onConsentChange(savedPreferences);
      }
    } else {
      // Show banner if no consent has been given
      setShowBanner(true);
    }
  }, []);

  const savePreferences = (prefs) => {
    const validatedPrefs = {
      necessary: true,
      analytics: !!prefs.analytics,
      marketing: !!prefs.marketing,
    };
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(validatedPrefs));
    } catch (error) {
      console.warn('[CookieConsent] Failed to save preferences:', error);
    }
    
    setPreferences(validatedPrefs);
    setHasConsented(true);
    
    // Notify parent of consent change
    if (onConsentChange) {
      onConsentChange(validatedPrefs);
    }
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