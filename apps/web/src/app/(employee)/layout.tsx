'use client';

import React from 'react';
import { useLogout } from '@/lib/hooks/useLogout';
import { LogOut, Heart } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth.store';

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const logout = useLogout();
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Employee TopBar */}
      <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-50 flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">W</div>
          <span className="font-bold text-navy hidden sm:inline">Wellbeing Metric</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-navy">{user?.full_name}</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Çalışan Paneli</p>
          </div>
          <div className="h-8 w-px bg-slate-100 mx-2" />
          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-danger hover:bg-danger/5 rounded-lg transition-all text-sm font-medium"
          >
            <LogOut size={18} />
            <span className="hidden xs:inline">Çıkış</span>
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        {children}
      </main>

      <footer className="py-8 px-12 border-t border-slate-100 text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
         Wellbeing Metric &copy; 2026 · Built with <Heart size={10} className="inline text-rose-500 mx-1" /> for Wellbeing
      </footer>
    </div>
  );
}
