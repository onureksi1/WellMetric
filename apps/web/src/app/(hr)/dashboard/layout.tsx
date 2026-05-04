'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import client from '@/lib/api/client';
import HrSidebar from '@/components/layout/HrSidebar';
import { PeriodSelector } from '@/components/shared/PeriodSelector';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { Bell, Search, User, Menu } from 'lucide-react';
import '@/lib/i18n';
import { SidebarProvider, useSidebar } from '@/lib/contexts/SidebarContext';

export default function HrLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <HrLayoutContent>{children}</HrLayoutContent>
    </SidebarProvider>
  );
}

function HrLayoutContent({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation(['dashboard', 'common']);
  const { toggleSidebar } = useSidebar();
  const { data: overview } = useQuery({
    queryKey: ['hr-overview-minimal'],
    queryFn: async () => {
      const res = await client.get('/hr/dashboard/overview');
      return res.data;
    },
    staleTime: 1000 * 60 * 30, // 30 mins
  });

  return (
    <div className="min-h-screen bg-gray-50/30 flex">
      <HrSidebar />
      <div className="flex-1 flex flex-col min-h-screen w-full lg:pl-64">
        {/* HR Top Bar */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
          <div className="flex items-center gap-3 md:gap-6">
             <button 
               onClick={toggleSidebar}
               className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
             >
               <Menu size={20} />
             </button>
             <div className="flex items-center gap-3">
               <div className="h-8 w-8 bg-primary/10 rounded-lg hidden sm:flex items-center justify-center text-primary font-bold text-xs">
                 {overview?.company_name?.slice(0, 2).toUpperCase() || 'WA'}
               </div>
               <span className="font-bold text-navy text-sm truncate max-w-[150px] sm:max-w-none">
                 {overview?.company_name || 'Yükleniyor...'}
               </span>
             </div>
             <div className="h-6 w-px bg-gray-100 hidden sm:block" />
             <div className="hidden md:block">
               <React.Suspense fallback={<div className="w-32 h-8 bg-gray-100 animate-pulse rounded-lg" />}>
                 <PeriodSelector />
               </React.Suspense>
             </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder={t('common.search_placeholder', 'Hızlı ara...')}
                className="bg-gray-50/50 border-none rounded-lg pl-9 pr-4 py-1.5 text-xs w-48 focus:w-64 focus:ring-2 focus:ring-primary/10 transition-all outline-none"
              />
            </div>

            <div className="flex items-center gap-2 md:gap-4">
               <div className="hidden sm:block">
                 <LanguageSwitcher />
               </div>
               <button className="text-gray-400 hover:text-navy transition-colors relative">
                  <Bell size={20} />
                  <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-danger text-white text-[8px] flex items-center justify-center rounded-full border-2 border-white">2</span>
               </button>
               <div className="h-8 w-px bg-gray-100 hidden sm:block" />
               <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                  <User size={18} />
               </div>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8 flex-1 w-full overflow-x-hidden">
          <React.Suspense fallback={<div className="flex justify-center py-20 text-gray-400">{t('common.loading', 'Yükleniyor...')}</div>}>
            {children}
          </React.Suspense>
        </main>
      </div>
    </div>
  );
}
