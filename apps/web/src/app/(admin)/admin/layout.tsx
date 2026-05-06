'use client';

import React from 'react';
import AdminSidebar from '@/components/layout/AdminSidebar';
import TopBar from '@/components/layout/TopBar';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';

import { SidebarProvider } from '@/lib/contexts/SidebarContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation('common');

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 flex">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-h-screen w-full lg:pl-64">
          <TopBar />
          <main className="p-4 md:p-8 flex-1 w-full overflow-x-hidden">
            <React.Suspense fallback={<div className="flex justify-center py-20 text-gray-400 italic">{t('common.loading')}</div>}>
              {children}
            </React.Suspense>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
