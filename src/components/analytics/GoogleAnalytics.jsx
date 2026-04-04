import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const GA_MEASUREMENT_ID = 'G-JZQZ0VT8XK';

export default function GoogleAnalytics({ enabled = false }) {
  const location = useLocation();
  const scriptsRef = useRef({ script1: null, script2: null });
  const isInitializedRef = useRef(false);

  // Initialize or cleanup GA based on enabled state
  useEffect(() => {
    if (enabled && !isInitializedRef.current && import.meta.env.PROD) {
      // Enable GA tracking
      window[`ga-disable-${GA_MEASUREMENT_ID}`] = false;
      
      // Load Google Analytics script
      const script1 = document.createElement('script');
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
      script1.setAttribute('data-cookie-consent', 'analytics');
      document.head.appendChild(script1);

      const script2 = document.createElement('script');
      script2.setAttribute('data-cookie-consent', 'analytics');
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${GA_MEASUREMENT_ID}', {
          send_page_view: false
        });
      `;
      document.head.appendChild(script2);

      scriptsRef.current = { script1, script2 };
      isInitializedRef.current = true;
    } else if (!enabled && isInitializedRef.current) {
      // Disable GA tracking
      window[`ga-disable-${GA_MEASUREMENT_ID}`] = true;
      
      // Remove GA scripts
      const scripts = document.querySelectorAll('script[data-cookie-consent="analytics"]');
      scripts.forEach(script => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      });
      
      scriptsRef.current = { script1: null, script2: null };
      isInitializedRef.current = false;
    }

    // Cleanup on unmount
    return () => {
      if (scriptsRef.current.script1?.parentNode) {
        scriptsRef.current.script1.parentNode.removeChild(scriptsRef.current.script1);
      }
      if (scriptsRef.current.script2?.parentNode) {
        scriptsRef.current.script2.parentNode.removeChild(scriptsRef.current.script2);
      }
    };
  }, [enabled]);

  // Track page views on route change (only when enabled)
  useEffect(() => {
    if (enabled && import.meta.env.PROD && window['gtag']) {
      window['gtag']('event', 'page_view', {
        page_path: location.pathname + location.search,
        page_location: window.location.href,
      });
    }
  }, [location, enabled]);

  return null;
}

// Helper function to track custom events
export const trackEvent = (eventName, eventParams = {}) => {
  if (import.meta.env.PROD && window['gtag']) {
    window['gtag']('event', eventName, eventParams);
  }
};