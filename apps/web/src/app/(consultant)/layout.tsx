'use client';

import React from 'react';
import { ConsultantSidebar } from '@/components/layout/ConsultantSidebar';
import { SidebarProvider } from '@/lib/contexts/SidebarContext';
import { Toaster } from 'react-hot-toast';

export default function ConsultantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-slate-50 flex">
        <ConsultantSidebar />
        <main className="flex-1 lg:pl-64 transition-all duration-300 min-h-screen w-full overflow-x-hidden">
          <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
        <Toaster position="top-right" />
      </div>
    </SidebarProvider>
  );
}
