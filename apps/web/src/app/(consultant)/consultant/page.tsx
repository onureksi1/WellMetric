'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Building2, 
  Users, 
  Target, 
  Activity, 
  AlertTriangle, 
  ArrowUpRight,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import Link from 'next/link';
import client from '@/lib/api/client';

export default function ConsultantDashboard() {
  const { t } = useTranslation('consultant');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await client.get('/consultant/dashboard/overview');
        setData(response.data);
      } catch (error) {
        console.error('Dashboard fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Veriler yükleniyor...</p>
      </div>
    );
  }

  const metrics = [
    { label: 'total_companies', value: data?.metrics?.total_companies || 0, icon: Building2, color: 'blue', change: '+0' },
    { label: 'total_employees', value: data?.metrics?.total_employees || 0, icon: Users, color: 'indigo', change: '+0' },
    { label: 'avg_wellbeing_score', value: (Number(data?.metrics?.avg_score) || 0).toFixed(1), icon: Activity, color: 'emerald', change: '0' },
    { label: 'participation_rate', value: `${data?.metrics?.avg_participation || 0}%`, icon: Target, color: 'purple', change: '0' },
    { label: 'active_surveys', value: data?.metrics?.active_surveys || 0, icon: TrendingUp, color: 'orange', change: '0' },
    { label: 'risk_alerts', value: data?.alerts?.length || 0, icon: AlertTriangle, color: 'red', change: '0' },
  ];

  return (
    <div className="space-y-8">
      {/* Header & Plan Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('dashboard.title')}</h1>
          <p className="text-slate-500">{t('dashboard.subtitle')}</p>
        </div>
        
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-6">
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">
              {t('dashboard.plan_usage', { 
                used: data?.metrics?.plan_usage?.used || 0, 
                max: data?.metrics?.plan_usage?.max || 5 
              })}
            </p>
            <div className="w-48 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-1000" 
                style={{ width: `${((data?.metrics?.plan_usage?.used || 0) / (data?.metrics?.plan_usage?.max || 5)) * 100}%` }} 
              />
            </div>
          </div>
          <button className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors">
            {t('dashboard.upgrade_plan')}
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-xl bg-blue-50 text-blue-600`}>
                <m.icon size={20} />
              </div>
              <span className="text-xs font-medium text-slate-400">
                {m.change}
              </span>
            </div>
            <p className="text-sm text-slate-500 font-medium">{t(`dashboard.metrics.${m.label}`)}</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Comparison Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">{t('dashboard.comparison_table')}</h3>
            <Link href="/consultant/companies" className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">
              {t('dashboard.view_all')} <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Firma</th>
                  <th className="px-6 py-4 text-center">Skor</th>
                  <th className="px-6 py-4 text-center">Katılım</th>
                  <th className="px-6 py-4">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.companies?.length > 0 ? (
                  data.companies.map((c: any) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer group">
                      <td className="px-6 py-4">
                        <Link href={`/consultant/companies/${c.id}`} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                            {c.name[0]}
                          </div>
                          <span className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">{c.name}</span>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-900">{c.score || '-'}</td>
                      <td className="px-6 py-4 text-center text-slate-600">{c.participation || '0'}%</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          (c.score || 0) > 70 ? 'bg-emerald-50 text-emerald-600' : 
                          (c.score || 0) > 50 ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {c.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm">
                      Henüz kayıtlı firma bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Health Map / Chart & Alerts */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
          <h3 className="font-bold text-slate-900">{t('dashboard.health_map')}</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.trend_data || []}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('dashboard.risk_alerts')}</h4>
            <div className="space-y-3">
              {data?.alerts?.length > 0 ? (
                data.alerts.map((alert: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
                    <AlertTriangle className="text-red-500 shrink-0" size={18} />
                    <div>
                      <p className="text-sm font-bold text-red-900">{alert.title}</p>
                      <p className="text-xs text-red-700">{alert.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                  <Activity className="text-emerald-500" size={18} />
                  <p className="text-xs text-emerald-800 font-medium">{t('dashboard.no_alerts')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
