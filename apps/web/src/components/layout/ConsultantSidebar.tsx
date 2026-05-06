'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard,
  Building2,
  ClipboardList,
  FileText,
  Bot,
  Settings,
  LogOut,
  ChevronRight,
  TrendingUp,
  X,
  CreditCard,
  Library,
  Calendar
} from 'lucide-react';
import { useT } from '@/hooks/useT';
import { useAuthStore } from '@/lib/store/auth.store';
import { useSidebar } from '@/lib/contexts/SidebarContext';
import { useLogout } from '@/lib/hooks/useLogout';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import client from '@/lib/api/client';
import { useSettings } from '@/contexts/SettingsContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const menuItems = [
  { name: 'menu.dashboard', icon: LayoutDashboard, path: '/consultant' },
  { name: 'menu.companies', icon: Building2, path: '/consultant/companies' },
  { name: 'menu.content', icon: Library, path: '/consultant/content' },
  { name: 'menu.surveys', icon: ClipboardList, path: '/consultant/surveys' },
  { name: 'menu.training', icon: Calendar, path: '/consultant/training' },
  { name: 'menu.reports', icon: FileText, path: '/consultant/reports' },
  { name: 'menu.ai', icon: Bot, path: '/consultant/ai' },
  { name: 'menu.billing', icon: CreditCard, path: '/consultant/billing' },
  { name: 'menu.settings', icon: Settings, path: '/consultant/settings' },
];

export function ConsultantSidebar() {
  const { t, tc, i18n } = useT('consultant');
  const pathname = usePathname();
  const { user } = useAuthStore();
  const logout = useLogout();
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const wl = useWhiteLabel();
  const { settings } = useSettings();
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
        "w-64 bg-[#fcfcfd] flex flex-col h-screen fixed left-0 top-0 z-[70] transition-transform duration-300 ease-in-out lg:translate-x-0 lg:shadow-none border-r border-slate-200/60",
        sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            {wl.isActive && wl.brandLogoUrl ? (
              <img src={wl.brandLogoUrl} alt={wl.brandName} className="h-8 object-contain" />
            ) : (
              <img src={settings?.platform_logo_url || "/images/logo.png"} alt={settings?.platform_name || "Wellbeing Metric"} className="h-10 object-contain" />
            )}
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-slate-900"
          >
            <X size={20} />
          </button>
        </div>

        {/* Profile Summary */}
        <div className="p-6 pb-2">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100/50">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm">
              <TrendingUp size={20} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-slate-900 truncate">{user?.full_name || tc('roles.consultant')}</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{tc(`plans.${(user as any)?.plan || 'starter'}`, { defaultValue: (user as any)?.plan || '' })}</span>
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
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                  isActive 
                    ? "bg-blue-50 text-blue-600 shadow-sm shadow-blue-100" 
                    : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-900"
                )}
              >
                <item.icon size={20} className={cn(isActive ? "text-blue-600" : "text-slate-400 group-hover:text-blue-600 transition-colors")} />
                <span className="text-sm font-semibold tracking-tight">{t(item.name)}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 space-y-1">
          <button
            onClick={toggleLanguage}
            className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                <span className="text-[10px] font-bold text-blue-600 uppercase">{i18n.language}</span>
              </div>
              <span className="text-sm font-medium">{i18n.language === 'tr' ? 'Türkçe' : 'English'}</span>
            </div>
            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
          </button>

          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all font-semibold"
          >
            <LogOut size={20} />
            <span className="text-sm">{t('menu.logout')}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
