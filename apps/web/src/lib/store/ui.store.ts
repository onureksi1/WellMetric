import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '@/lib/i18n';
import apiClient from '@/lib/api/client';

interface UIStore {
  language: 'tr' | 'en';
  setLanguage: (lang: 'tr' | 'en') => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      language: 'tr',
      setLanguage: (lang) => {
        set({ language: lang });
        i18n.changeLanguage(lang);
        // Update API headers
        apiClient.defaults.headers['Accept-Language'] = lang;
        // Also update localStorage for the interceptor fallback
        if (typeof window !== 'undefined') {
          localStorage.setItem('language', lang);
        }
      },
    }),
    { 
      name: 'ui-store',
      // Ensure hydration doesn't break i18n sync
      onRehydrateStorage: () => (state) => {
        if (state) {
          i18n.changeLanguage(state.language);
          apiClient.defaults.headers['Accept-Language'] = state.language;
        }
      }
    }
  )
);
