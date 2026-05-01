'use client';

import { useEffect } from "react";
import { useUIStore } from "@/lib/store/ui.store";
import i18n from "@/lib/i18n";

export function I18nSync() {
  const { language } = useUIStore();

  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language]);

  return null;
}
