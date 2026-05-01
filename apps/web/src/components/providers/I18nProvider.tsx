'use client';

import React, { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Sync language from html tag if set by server
    const htmlLang = document.documentElement.lang;
    if (htmlLang && i18n.language !== htmlLang) {
      i18n.changeLanguage(htmlLang);
    }
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
