'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, 
  Building2, 
  Users,
  ClipboardList, 
  Library, 
  Settings, 
  Bot, 
  History,
  LogOut,
  ChevronRight,
  Mail,
  Factory,
  Zap,
  GraduationCap,
  Layers,
  DollarSign
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth.store';
import { useApi } from '@/lib/hooks/use-api';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import { useLogout } from '@/lib/hooks/useLogout';
import '@/lib/i18n'; 

const menuItems = [
  { name: 'admin.menu.home', icon: Home, href: '/admin' },
  { name: 'admin.menu.consultants', icon: GraduationCap, href: '/admin/consultants' },
  { name: 'admin.menu.companies', icon: Building2, href: '/admin/companies' },
  { name: 'admin.menu.users', icon: Users, href: '/admin/users' },
  { name: 'admin.menu.industries', icon: Factory, href: '/admin/industries' },
  { name: 'admin.menu.surveys', icon: ClipboardList, href: '/admin/surveys' },
  { name: 'admin.menu.campaigns', icon: Layers, href: '/admin/campaigns' },
  { name: 'admin.menu.content', icon: Library, href: '/admin/content' },
  { name: 'admin.menu.mail_templates', icon: Mail, href: '/admin/mail-templates' },
  { name: 'admin.menu.demo_requests', icon: Zap, href: '/admin/demo-requests' },
  { name: 'admin.menu.billing', icon: DollarSign, href: '/admin/billing' },
  { name: 'admin.menu.settings', icon: Settings, href: '/admin/settings' },
];

import { useSidebar } from '@/lib/contexts/SidebarContext';
import { Menu, X, Languages } from 'lucide-react';
import client from '@/lib/api/client';

export default function AdminSidebar() {
  const pathname = usePathname();
  const { t, i18n } = useTranslation('admin');
  const { user } = useAuthStore();
  const logout = useLogout();
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const [mounted, setMounted] = React.useState(false);

  const { data: pendingRes } = useApi<any>('/admin/demo-requests/pending-count');
  const pendingCount = typeof pendingRes === 'number' ? pendingRes : 0;

  const { data: statsRes } = useApi<any>('/admin/users/stats');
  const pendingInvites = statsRes?.pending_invite || 0;

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleLanguage = async () => {
    const newLang = i18n.language === 'tr' ? 'en' : 'tr';
    try {
      await i18n.changeLanguage(newLang);
      localStorage.setItem('i18nextLng', newLang);
      await client.patch('/auth/language', { language: newLang });
    } catch (error) {
      console.error('Language change error:', error);
    }
  };

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
        "w-64 bg-navy text-white flex flex-col h-screen fixed left-0 top-0 z-[70] transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-2xl lg:shadow-none",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20">W</div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Wellbeing Metric</h1>
              <p className="text-xs text-gray-400">{mounted ? t('menu.panel_subtitle') : 'Super Admin Panel'}</p>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          const translationKey = item.name.replace('admin.', '');
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group',
                isActive ? 'bg-primary text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} className={clsx(isActive ? 'text-white' : 'text-gray-400 group-hover:text-primary-light')} />
                <span className="text-sm font-medium">{mounted ? t(translationKey) : ''}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.href === '/admin/demo-requests' && pendingCount > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-lg animate-pulse">
                    {pendingCount}
                  </span>
                )}
                {item.href === '/admin/users' && pendingInvites > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-navy shadow-lg">
                    {pendingInvites}
                  </span>
                )}
                {isActive && <ChevronRight size={16} />}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-2">
        <button
          onClick={toggleLanguage}
          className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10">
              <span className="text-[10px] font-bold text-primary-light uppercase">{i18n.language}</span>
            </div>
            <span className="text-sm font-medium">{i18n.language === 'tr' ? 'Türkçe' : 'English'}</span>
          </div>
          <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
        </button>

        <div className="flex items-center gap-3 px-3 py-2">
          <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold shrink-0">
            {user?.full_name?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.full_name}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-400 hover:text-danger hover:bg-danger/5 rounded-lg transition-colors"
        >
          <LogOut size={18} />
          <span>{mounted ? t('menu.logout') : 'Logout'}</span>
        </button>
      </div>
    </aside>
    </>
  );
}
