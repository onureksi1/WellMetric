'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '@/lib/api/client';

interface PlatformSettings {
  platform_name: string;
  platform_logo_url: string | null;
  platform_url: string | null;
  [key: string]: any;
}

interface SettingsContextType {
  settings: PlatformSettings | null;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: null,
  loading: true,
  refreshSettings: async () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await client.get('/settings/public');
      console.log('[SettingsContext] Fetched settings:', res.data);
      setSettings(res.data);
    } catch (err) {
      console.error('[SettingsContext] Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (settings?.platform_logo_url) {
      const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (link) {
        link.href = settings.platform_logo_url;
      } else {
        const newLink = document.createElement('link');
        newLink.rel = 'icon';
        newLink.href = settings.platform_logo_url;
        document.head.appendChild(newLink);
      }
    }
  }, [settings?.platform_logo_url]);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
