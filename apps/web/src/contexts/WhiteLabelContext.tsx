'use client';
import React, { createContext, useContext, useEffect } from 'react';

interface WhiteLabelConfig {
  isActive: boolean;
  brandName: string;
  brandLogoUrl: string | null;
  brandColor: string;
  brandFaviconUrl: string | null;
}

const DEFAULT_CONFIG: WhiteLabelConfig = {
  isActive:     false,
  brandName:    'WellBeing Metric',
  brandLogoUrl: null,
  brandColor:   '#6C3A8E',
  brandFaviconUrl: null,
};

const WhiteLabelContext = createContext<WhiteLabelConfig>(DEFAULT_CONFIG);

export function WhiteLabelProvider({
  children,
  serverConfig,
}: {
  children: React.ReactNode;
  serverConfig?: Partial<WhiteLabelConfig>;
}) {
  const config = { ...DEFAULT_CONFIG, ...serverConfig };

  // CSS variable olarak marka rengini inject et
  useEffect(() => {
    if (config.isActive) {
      if (config.brandColor) {
        document.documentElement.style.setProperty(
          '--wl-brand-color', config.brandColor
        );
      }
      // Favicon güncelle
      if (config.brandFaviconUrl) {
        const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
        if (link) {
          link.href = config.brandFaviconUrl;
        } else {
          const newLink = document.createElement('link');
          newLink.rel = 'icon';
          newLink.href = config.brandFaviconUrl;
          document.head.appendChild(newLink);
        }
      }
    }
  }, [config.isActive, config.brandColor, config.brandFaviconUrl]);

  return (
    <WhiteLabelContext.Provider value={config}>
      {children}
    </WhiteLabelContext.Provider>
  );
}

export const useWhiteLabel = () => useContext(WhiteLabelContext);
