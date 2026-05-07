'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '@/lib/api/client';
import { Bell, Check, Trash2, X, ExternalLink, Inbox } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  type: string;
  titleTr: string;
  titleEn: string;
  bodyTr: string;
  bodyEn: string;
  link?: string;
  isRead: boolean;
  metadata?: any;
  createdAt: string;
}

export const NotificationDrawer: React.FC = () => {
  const router = useRouter();
  const { t, i18n } = useTranslation(['common']);
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const locale = i18n.language === 'en' ? enUS : tr;

  // ── Fetch Notifications ──────────────────────────────────────────
  const { data: notifications = [], refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await client.get<Notification[]>('/notifications');
      console.log('RAW NOTIFICATIONS DATA:', res.data);
      return res.data;
    },
    refetchInterval: 30000, // Poll every 30s
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      const res = await client.get<{ count: number }>('/notifications/unread/count');
      return res.data.count;
    },
    refetchInterval: 30000,
  });

  // ── Mutations ────────────────────────────────────────────────────
  const markReadMutation = useMutation({
    mutationFn: (id: string) => client.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => client.post('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  // ── Handlers ─────────────────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => setIsOpen(!isOpen);

  const handleMarkRead = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    markReadMutation.mutate(id);
  };

  const handleNotificationClick = (notif: Notification) => {
    console.log('Notification clicked:', notif);
    if (!notif.isRead) {
      markReadMutation.mutate(notif.id);
    }
    if (notif.link) {
      console.log('Navigating to:', notif.link);
      window.location.href = notif.link;
    }
    setIsOpen(false);
  };

  const formatNotifDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return formatDistanceToNow(d, { addSuffix: true, locale });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={handleToggle}
        className="text-gray-400 hover:text-navy transition-colors relative p-2 rounded-lg hover:bg-gray-100"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-danger text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white animate-in zoom-in duration-300">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
            <h3 className="font-bold text-navy text-sm flex items-center gap-2">
              {t('notifications.title', 'Bildirimler')}
              {unreadCount > 0 && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
            </h3>
            {unreadCount > 0 && (
              <button 
                onClick={() => markAllReadMutation.mutate()}
                className="text-[11px] text-primary hover:underline font-medium flex items-center gap-1"
              >
                <Check size={12} />
                {t('notifications.mark_all_read', 'Tümünü okundu işaretle')}
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-3">
                <div className="p-3 bg-gray-50 rounded-full">
                  <Inbox size={24} className="text-gray-300" />
                </div>
                <p className="text-xs">{t('notifications.empty', 'Henüz bildiriminiz yok.')}</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <button 
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer relative z-10 group ${!notif.isRead ? 'bg-primary/5' : ''}`}
                >
                  <div className="flex gap-3">
                    <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${!notif.isRead ? 'bg-primary' : 'bg-transparent'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-xs font-bold truncate ${!notif.isRead ? 'text-navy' : 'text-gray-600'}`}>
                          {i18n.language === 'en' ? notif.titleEn : notif.titleTr}
                        </span>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                          {formatNotifDate(notif.createdAt)}
                        </span>
                      </div>
                      <p className={`text-xs leading-relaxed ${!notif.isRead ? 'text-gray-700' : 'text-gray-500'} line-clamp-2`}>
                        {i18n.language === 'en' ? notif.bodyEn : notif.bodyTr}
                      </p>
                      
                      {notif.link && (
                        <div className="mt-2 inline-flex items-center gap-1 text-[10px] text-primary font-medium hover:underline">
                          {t('notifications.view_details', 'Detayları Görüntüle')}
                          <ExternalLink size={10} />
                        </div>
                      )}
                    </div>
                    
                    {!notif.isRead && (
                      <button 
                        onClick={(e) => handleMarkRead(e, notif.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-primary transition-all rounded-md hover:bg-white"
                        title={t('notifications.mark_read', 'Okundu işaretle')}
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-50 text-center">
              <button 
                onClick={() => setIsOpen(false)}
                className="text-xs text-gray-500 hover:text-navy font-medium"
              >
                {t('notifications.close', 'Kapat')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
