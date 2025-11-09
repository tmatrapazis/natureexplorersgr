import { en } from './en';
import { el } from './el';

const translations = {
  en,
  el,
};

export const getTranslation = (language, key) => {
  const keys = key.split('.');
  let value = translations[language];
  
  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k];
    } else {
      return key; // Return key if translation not found
    }
  }
  
  return value || key;
};

export const useTranslation = (language) => {
  const t = (key) => getTranslation(language, key);
  return { t };
};