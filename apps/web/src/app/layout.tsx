import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import { DebugOverlay } from "@/components/ui/DebugOverlay";
import { AppProviders } from "@/components/providers/AppProviders";
import { I18nSync } from "@/components/providers/I18nSync";
import { headers } from 'next/headers';
import { WhiteLabelProvider } from '@/contexts/WhiteLabelContext';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Wellbeing Metric | Kurumsal Esenlik Platformu",
  description: "Şirketinizin wellbeing skorlarını takip edin, yapay zeka destekli analizlerle aksiyon alın.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = headers();
  const isWLActive  = headersList.get('x-wl-active') === 'true';

  const wlConfig = isWLActive ? {
    isActive:     true,
    brandName:    headersList.get('x-wl-brand-name') ?? 'Wellbeing Platformu',
    brandColor:   headersList.get('x-wl-brand-color') ?? '#6C3A8E',
    brandLogoUrl: headersList.get('x-wl-logo-url') || null,
    brandFaviconUrl: headersList.get('x-wl-favicon-url') || null,
  } : undefined;

  return (
    <html lang="tr">
      <head>
        {wlConfig?.brandFaviconUrl && (
          <link rel="icon" href={wlConfig.brandFaviconUrl} />
        )}
        <title>{wlConfig?.brandName ?? 'WellBeing Metric'}</title>
      </head>
      <body className={`${outfit.className} bg-slate-50 text-navy antialiased`}>
        <WhiteLabelProvider serverConfig={wlConfig}>
          <ErrorBoundary>
            <AppProviders>
              <I18nSync />
              {children}
              <Toaster position="top-right" />
              <DebugOverlay />
            </AppProviders>
          </ErrorBoundary>
        </WhiteLabelProvider>
      </body>
    </html>
  );
}
