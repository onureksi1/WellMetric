'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  ClipboardList, 
  Zap, 
  BarChart, 
  FileText,
  Bot,
  LogOut,
  ChevronRight,
  Mail
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth.store';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import { useLogout } from '@/lib/hooks/useLogout';
import '@/lib/i18n';

const menuItems = [
  { name: 'menu.overview', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'menu.departments', icon: Building2, href: '/dashboard/departments' },
  { name: 'menu.employees', icon: Users, href: '/dashboard/employees' },
  { name: 'menu.surveys', icon: ClipboardList, href: '/dashboard/surveys' },
  { name: 'menu.campaigns', icon: Mail, href: '/dashboard/campaigns' },
  { name: 'menu.actions', icon: Zap, href: '/dashboard/actions' },
  { name: 'menu.segments', icon: BarChart, href: '/dashboard/segments' },
  { name: 'menu.reports', icon: FileText, href: '/dashboard/reports' },
  { name: 'menu.ai_assistant', icon: Bot, href: '/dashboard/ai' },
];

import { useSidebar } from '@/lib/contexts/SidebarContext';
import { X } from 'lucide-react';

export default function HrSidebar() {
  const pathname = usePathname();
  const { t } = useTranslation('dashboard');
  const { user } = useAuthStore();
  const logout = useLogout();
  const { sidebarOpen, setSidebarOpen } = useSidebar();

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-[60] lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={clsx(
        "w-64 bg-white border-r border-gray-100 flex flex-col h-screen fixed left-0 top-0 z-[70] transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-2xl lg:shadow-none",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center justify-between border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20">W</div>
            <div>
              <h1 className="font-bold text-lg leading-tight text-navy">{t('well_analytics', 'Wellbeing Metric')}</h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t('hr_dashboard', 'HR Dashboard')}</p>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-gray-400 hover:text-navy"
          >
            <X size={20} />
          </button>
        </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group',
                isActive ? 'bg-primary/5 text-primary' : 'text-gray-500 hover:bg-gray-50 hover:text-navy'
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} className={clsx(isActive ? 'text-primary' : 'text-gray-400 group-hover:text-primary')} />
                <span className="text-sm font-semibold">{t(item.name)}</span>
              </div>
              {isActive && <ChevronRight size={16} />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-50">
        <div className="flex items-center gap-3 px-3 py-4 bg-gray-50 rounded-xl mb-2">
          <div className="h-9 w-9 rounded-lg bg-primary text-white flex items-center justify-center text-sm font-bold shadow-sm">
            {user?.full_name?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-navy truncate">{user?.full_name}</p>
            <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-400 hover:text-danger hover:bg-danger/5 rounded-lg transition-colors"
        >
          <LogOut size={18} />
          <span className="font-medium">{t('menu.logout')}</span>
        </button>
      </div>
    </aside>
    </>
  );
}
