import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'vi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

import enTranslations from '../i18n/locales/en.json';
import viTranslations from '../i18n/locales/vi.json';

const translations: Record<Language, any> = {
  en: enTranslations,
  vi: viTranslations,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const savedLang = localStorage.getItem('app_lang') as Language;
    return savedLang || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_lang', lang);
  };

  const t = (key: string): string => {
    // 1. Try old behavior: one top-level group, and subKey containing dots.
    // e.g. "settings" -> "profile.basic_info"
    const parts = key.split('.');
    const group = parts[0];
    const subKey = parts.slice(1).join('.');
    
    if (translations[language] && translations[language][group] && translations[language][group][subKey]) {
      return translations[language][group][subKey];
    }
    
    // 2. Try new behavior: recursively resolve deeply nested JSON structure.
    let result: any = translations[language];
    for (const part of parts) {
      if (result && typeof result === 'object' && part in result) {
        result = result[part];
      } else {
        result = undefined;
        break;
      }
    }
    
    if (result && typeof result === 'string') {
      return result;
    }

    // 3. Fallback if the key doesn't have a group or is just a flat top-level key
    return translations[language]?.[key] || key;
  };
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
