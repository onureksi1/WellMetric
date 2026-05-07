'use client';

import React from 'react';
import { ConsultantSidebar } from '@/components/layout/ConsultantSidebar';
import { SidebarProvider, useSidebar } from '@/lib/contexts/SidebarContext';
import { Toaster } from 'react-hot-toast';
import { NotificationDrawer } from '@/components/shared/NotificationDrawer';
import { Menu, User, Search } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth.store';

export default function ConsultantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <ConsultantLayoutContent>{children}</ConsultantLayoutContent>
      <Toaster position="top-right" />
    </SidebarProvider>
  );
}

function ConsultantLayoutContent({ children }: { children: React.ReactNode }) {
  const { toggleSidebar } = useSidebar();
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <ConsultantSidebar />
      <div className="flex-1 flex flex-col min-h-screen w-full lg:pl-64">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleSidebar}
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
              <Search size={14} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="Hızlı ara..." 
                className="bg-transparent border-none text-xs outline-none w-32 focus:w-48 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NotificationDrawer />
            <div className="h-8 w-px bg-slate-100 hidden sm:block" />
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-bold text-slate-900 leading-none">{user?.full_name}</span>
                <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{user?.role}</span>
              </div>
              <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-blue-100">
                {user?.full_name?.slice(0, 1).toUpperCase() || 'C'}
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8 flex-1 w-full overflow-x-hidden">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
