'use client';

import React from 'react';
import { Bell, Search, Globe } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth.store';
import { LanguageSwitcher } from '../shared/LanguageSwitcher';

import { useTranslation } from 'react-i18next';
import '@/lib/i18n';

import { Menu } from 'lucide-react';
import { useSidebar } from '@/lib/contexts/SidebarContext';

export default function TopBar() {
  const { t } = useTranslation('common');
  const { user } = useAuthStore();
  const { toggleSidebar } = useSidebar();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu size={20} />
        </button>
        <div className="relative hidden sm:block w-64 md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder={mounted ? t('common.header.search_placeholder', 'Search anything...') : 'Search...'}
            className="w-full bg-gray-50 border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <LanguageSwitcher />
        
        <button className="relative text-gray-400 hover:text-navy transition-colors">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-danger text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">
            3
          </span>
        </button>

        <div className="h-8 w-px bg-gray-100" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-navy">{user?.full_name || 'System Admin'}</p>
            <p className="text-xs text-gray-500 uppercase tracking-tighter">{user?.role?.replace('_', ' ') || 'Platform Control'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
