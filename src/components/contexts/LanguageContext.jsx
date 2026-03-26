import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const LanguageContext = createContext(/** @type {any} */(undefined));

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // localStorage read only on mount — no synchronous cost on subsequent renders
    try { return localStorage.getItem('app_language') || 'en'; } catch { return 'en'; }
  });

  useEffect(() => {
    try { localStorage.setItem('app_language', language); } catch { /* storage unavailable */ }
  }, [language]);

  // Stable reference — only recreated when the setter identity changes (never)
  const toggleLanguage = useCallback(() => {
    setLanguage(prev => prev === 'en' ? 'el' : 'en');
  }, []);

  // Stable object — only a new reference when `language` actually changes,
  // preventing unnecessary re-renders in every useLanguage() consumer.
  const value = useMemo(
    () => ({ language, setLanguage, toggleLanguage }),
    [language, toggleLanguage]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
