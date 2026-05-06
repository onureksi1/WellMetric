'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useT } from '@/hooks/useT';
import {
  User,
  Shield,
  CreditCard,
  Bell,
  LogOut,
  Camera,
  Bot,
  Loader2,
  Key,
  Clock
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth.store';
import { toast } from 'react-hot-toast';
import client from '@/lib/api/client';

type ConsultantUserView = any & {
  first_name?: string;
  last_name?: string;
  name?: string;
  full_name?: string;
  email?: string;
};

const getUserInitials = (rawUser: ConsultantUserView | null | undefined) => {
  const first = rawUser?.first_name || rawUser?.name || rawUser?.full_name || rawUser?.email || 'U';
  const last = rawUser?.last_name || '';
  return `${first[0] || 'U'}${last[0] || ''}`.toUpperCase();
};

const getDisplayName = (rawUser: ConsultantUserView | null | undefined) => {
  if (rawUser?.name) return rawUser.name;
  if (rawUser?.first_name) return `${rawUser.first_name} ${rawUser?.last_name || ''}`.trim();
  if (rawUser?.full_name) return rawUser.full_name;
  return 'User';
};

function SettingsContent() {
  const { t, tc } = useT('consultant');
  const { user, clearAuth } = useAuthStore();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');
  const [loading, setLoading] = useState(true);
  const [planData, setPlanData] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [language, setLanguage] = useState('tr');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const consultantUser = user as ConsultantUserView;

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [dashRes, meRes] = await Promise.all([
          client.get('/consultant/dashboard/overview'),
          client.get('/auth/me')
        ]);

        setPlanData(dashRes.data.metrics?.plan_usage || { used: 0, max: 5 });

        const userData = meRes.data.data || meRes.data;
        setFullName(userData.full_name || '');
        setEmail(userData.email || '');
        setPhone(userData.phone || '');
        setLanguage(userData.language || 'tr');
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSaveProfile = async () => {
    setProfileLoading(true);
    try {
      await client.patch('/auth/me', {
        full_name: fullName,
        phone: phone,
        language: language
      });
      toast.success(t('settings.success'));
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || t('settings.password_error'));
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error(t('settings.passwords_mismatch'));
      return;
    }
    if (newPassword.length < 8) {
      toast.error(t('settings.password_min_length'));
      return;
    }

    setPasswordLoading(true);
    try {
      await client.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success(t('settings.password_success'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      if (err.response?.status === 401) {
        toast.error(t('settings.wrong_current_password'));
      } else {
        toast.error(err.response?.data?.error?.message || t('settings.password_error'));
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium">{t('settings.loading')}</p>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: t('settings.profile_title'), icon: User },
    { id: 'auto-reporting', label: t('reports.auto_reporting'), icon: Clock },
    { id: 'security', label: t('settings.change_password'), icon: Shield },
    { id: 'plan', label: t('settings.plan_title'), icon: CreditCard },
    { id: 'notifications', label: tc('notifications', 'Bildirimler'), icon: Bell },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('settings.title')}</h1>
        <p className="text-slate-500">{t('settings.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-600 hover:bg-white hover:shadow-sm'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
          <div className="pt-4 mt-4 border-t border-slate-200">
            <button
              onClick={clearAuth}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
            >
              <LogOut size={18} />
              {t('menu.logout')}
            </button>
          </div>
        </div>

        <div className="md:col-span-3">
          {activeTab === 'profile' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border-2 border-white shadow-md font-bold text-2xl uppercase">
                      {getUserInitials(consultantUser)}
                    </div>
                    <button className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full border-2 border-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera size={12} />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{getDisplayName(consultantUser)}</h3>
                    <p className="text-sm text-slate-500">{t('settings.profile_role')}</p>
                  </div>
                </div>
                <button
                  onClick={handleSaveProfile}
                  disabled={profileLoading}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {profileLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {t('settings.save')}
                </button>
              </div>

              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('settings.full_name')}</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('settings.email')}</label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{tc('phone', 'Telefon')}</label>
                  <input
                    type="tel"
                    placeholder="+90 5XX XXX XX XX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{tc('language', 'Dil')}</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm appearance-none"
                  >
                    <option value="tr">Türkçe</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                  <Key size={20} />
                </div>
                <h3 className="font-bold text-slate-900">{t('settings.change_password')}</h3>
              </div>

              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('settings.current_password')}</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('settings.new_password')}</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('settings.confirm_password')}</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
                <button
                  onClick={handleUpdatePassword}
                  disabled={passwordLoading}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all mt-4 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {t('settings.update_password')}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'plan' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <CreditCard size={20} />
                  </div>
                  <h3 className="font-bold text-slate-900">{t('settings.plan_title')}</h3>
                </div>
                <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-bold uppercase rounded-full tracking-wider">
                  {tc(`plans.${(user as any)?.plan || 'starter'}`, { defaultValue: (user as any)?.plan || 'Plan' })}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('settings.companies_used')}</p>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold text-slate-900">{planData?.used || 0} / {planData?.max || 5}</span>
                    {planData?.used >= planData?.max && <span className="text-xs text-red-500 font-medium mb-1">%100</span>}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('settings.ai_enabled')}</p>
                  <div className="flex items-center gap-2 text-emerald-600">
                    <Bot size={20} />
                    <span className="text-sm font-bold uppercase">{tc('unlimited', 'Sınırsız')}</span>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('settings.valid_until')}</p>
                  <div className="flex items-center gap-2 text-slate-700 font-bold">
                    <span className="text-sm">12.06.2024</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'auto-reporting' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Clock size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{t('reports.auto_reporting')}</h3>
                  <p className="text-sm text-slate-500">{t('reports.auto_reporting_desc')}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-6 rounded-[24px] border-2 border-slate-50 hover:border-indigo-100 transition-all">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900">{t('reports.auto_reporting_enable')}</p>
                    <p className="text-xs text-slate-500">{t('reports.auto_reporting_enable_desc')}</p>
                  </div>
                  <div className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none bg-indigo-600">
                    <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('reports.frequency')}</label>
                    <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm appearance-none">
                      <option value="quarterly">{t('reports.frequency_quarterly')}</option>
                      <option value="monthly">{t('reports.frequency_monthly')}</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('reports.email_recipient')}</label>
                    <input
                      type="email"
                      defaultValue={user?.email}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                    />
                  </div>
                </div>

                <button
                  onClick={() => toast.success(t('reports.save_success'))}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                >
                  {t('settings.save_settings')}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h3 className="font-bold text-slate-900 mb-4">{t('settings.notifications_title')}</h3>
              <div className="space-y-4">
                {[
                  { id: 'email_reports', label: t('settings.email_reports_label'), desc: t('settings.email_reports_desc') },
                  { id: 'risk_alerts', label: t('settings.risk_alerts_label'), desc: t('settings.risk_alerts_desc') },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                    <div className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none bg-blue-600">
                      <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ConsultantSettingsPage() {
  return (
    <Suspense fallback={
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
