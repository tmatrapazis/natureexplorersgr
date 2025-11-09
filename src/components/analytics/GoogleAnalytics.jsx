import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Replace with your actual GA4 Measurement ID
const GA_MEASUREMENT_ID = 'G-JZQZ0VT8XK'; // TODO: Replace with your GA4 ID

export default function GoogleAnalytics() {
  const location = useLocation();

  // Initialize GA4 on component mount
  useEffect(() => {
    // Load GA4 script
    
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script1);

    // Initialize gtag
    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_MEASUREMENT_ID}', {
        send_page_view: false
      });
    `;
    document.head.appendChild(script2);

    return () => {
      // Cleanup scripts on unmount
      document.head.removeChild(script1);
      document.head.removeChild(script2);
    };
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: location.pathname + location.search,
        page_location: window.location.href,
      });
    }
  }, [location]);

  return null;
}

// Helper function to track custom events
export const trackEvent = (eventName, eventParams = {}) => {
  if (window.gtag) {
    window.gtag('event', eventName, eventParams);
  } else {
    console.warn('GA4 not loaded yet');
  }
};