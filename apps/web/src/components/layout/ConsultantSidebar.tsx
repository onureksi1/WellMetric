'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Building2, 
  ClipboardList, 
  BarChart3, 
  Bot, 
  Settings, 
  LogOut,
  ChevronRight,
  TrendingUp,
  X,
  CreditCard,
  Video
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/lib/store/auth.store';
import { useSidebar } from '@/lib/contexts/SidebarContext';
import { useLogout } from '@/lib/hooks/useLogout';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import client from '@/lib/api/client';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const menuItems = [
  { name: 'menu.dashboard', icon: LayoutDashboard, path: '/consultant' },
  { name: 'menu.companies', icon: Building2, path: '/consultant/companies' },
  { name: 'menu.content', icon: Video, path: '/consultant/content' },
  { name: 'menu.surveys', icon: ClipboardList, path: '/consultant/surveys' },
  { name: 'menu.reports', icon: BarChart3, path: '/consultant/reports' },
  { name: 'menu.ai', icon: Bot, path: '/consultant/ai' },
  { name: 'menu.billing', icon: CreditCard, path: '/consultant/billing' },
  { name: 'menu.settings', icon: Settings, path: '/consultant/settings' },
];

export function ConsultantSidebar() {
  const { t, i18n } = useTranslation('consultant');
  const pathname = usePathname();
  const { user } = useAuthStore();
  const logout = useLogout();
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleLanguage = async () => {
    const newLang = i18n.language === 'tr' ? 'en' : 'tr';
    try {
      await i18n.changeLanguage(newLang);
      localStorage.setItem('i18nextLng', newLang);
      // Optional: sync with backend
      await client.patch('/auth/language', { language: newLang });
    } catch (error) {
      console.error('Language change error:', error);
    }
  };

  if (!mounted) return null;

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={cn(
        "w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 z-[70] transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-2xl lg:shadow-none border-r border-slate-800",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Wellbeing Metric
          </span>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Profile Summary */}
        <div className="p-6 pb-2">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
              <TrendingUp size={20} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-white truncate">{user?.full_name || 'Eğitmen'}</span>
              <span className="text-xs text-slate-400">Growth Plan</span>
            </div>
          </div>
          
          <div className="mt-4 px-2">
            <div className="flex justify-between text-xs mb-1 text-slate-400">
              <span>{t('dashboard.plan_usage', { used: 3, max: 5 })}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '60%' }} />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.path || (item.path !== '/consultant' && pathname.startsWith(item.path));
            
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group",
                  isActive 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
                    : "hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon size={20} className={cn(isActive ? "text-white" : "text-slate-400 group-hover:text-blue-400")} />
                <span className="text-sm font-medium">{t(item.name)}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 space-y-1">
          <button
            onClick={toggleLanguage}
            className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center group-hover:bg-slate-700">
                <span className="text-[10px] font-bold text-blue-400 uppercase">{i18n.language}</span>
              </div>
              <span className="text-sm font-medium">{i18n.language === 'tr' ? 'Türkçe' : 'English'}</span>
            </div>
            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
          </button>

          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <LogOut size={20} />
            <span className="text-sm font-medium">{t('menu.logout')}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
