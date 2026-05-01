import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import { DebugOverlay } from "@/components/ui/DebugOverlay";
import { AppProviders } from "@/components/providers/AppProviders";
import { I18nSync } from "@/components/providers/I18nSync";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Wellbeing Metric | Kurumsal Esenlik Platformu",
  description: "Şirketinizin wellbeing skorlarını takip edin, yapay zeka destekli analizlerle aksiyon alın.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${inter.className} bg-slate-50 text-navy antialiased`}>
        <AppProviders>
          <I18nSync />
          {children}
          <Toaster position="top-right" />
          <DebugOverlay />
        </AppProviders>
      </body>
    </html>
  );
}
