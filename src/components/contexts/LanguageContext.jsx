import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext(/** @type {any} */(undefined));

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Try to get language from localStorage, default to English
    const savedLanguage = localStorage.getItem('app_language');
    return savedLanguage || 'en';
  });

  useEffect(() => {
    // Save language preference to localStorage whenever it changes
    localStorage.setItem('app_language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'el' : 'en');
  };

  const value = {
    language,
    setLanguage,
    toggleLanguage,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};