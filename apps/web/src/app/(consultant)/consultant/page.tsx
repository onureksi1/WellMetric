'use client';

import React, { useEffect, useState } from 'react';
import { useT } from '@/hooks/useT';
import {
  Building2,
  Users,
  Target,
  Activity,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Loader2,
  Zap,
  Mail,
  CreditCard
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import client from '@/lib/api/client';

export default function ConsultantDashboard() {
  const { t, tc } = useT('consultant');
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [credits, setCredits] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [overviewRes, creditsRes] = await Promise.allSettled([
          client.get('/consultant/dashboard/overview'),
          client.get('/consultant/billing/credits'),
        ]);
        if (overviewRes.status === 'fulfilled') setData(overviewRes.value.data);
        if (creditsRes.status === 'fulfilled') setCredits(creditsRes.value.data || []);
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
        <p className="text-slate-500 font-medium animate-pulse">{tc('loading')}</p>
      </div>
    );
  }

  const metrics = [
    { label: 'total_companies',    value: data?.metrics?.total_companies || 0,                                  icon: Building2,    color: 'blue',    change: '+0' },
    { label: 'total_employees',    value: data?.metrics?.total_employees || 0,                                  icon: Users,        color: 'indigo',  change: '+0' },
    { label: 'avg_wellbeing_score',value: (Number(data?.metrics?.avg_score) || 0).toFixed(1),                   icon: Activity,     color: 'emerald', change: '0' },
    { label: 'participation_rate', value: `${data?.metrics?.avg_participation || 0}%`,                         icon: Target,       color: 'purple',  change: '0' },
    { label: 'active_surveys',     value: data?.metrics?.active_surveys || 0,                                   icon: TrendingUp,   color: 'orange',  change: '0' },
    { label: 'risk_alerts',        value: data?.alerts?.length || 0,                                            icon: AlertTriangle,color: 'red',     change: '0' },
  ];

  return (
    <div className="space-y-8">
      {/* Header & Plan Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('trainer_dashboard.title')}</h1>
          <p className="text-slate-500">{t('trainer_dashboard.subtitle')}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-6">
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">
              {t('trainer_dashboard.plan_usage', {
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
          <button 
            onClick={() => router.push('/consultant/billing/upgrade')}
            className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors"
          >
            {t('trainer_dashboard.upgrade_plan')}
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <m.icon size={20} />
              </div>
              <span className="text-xs font-medium text-slate-400">{m.change}</span>
            </div>
            <p className="text-sm text-slate-500 font-medium">{t(`trainer_dashboard.metrics.${m.label}`)}</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Credit Balances */}
      {credits.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CreditCard size={18} className="text-slate-400" />
              <h3 className="text-sm font-bold text-slate-700">{t('billing.tabs.credits')}</h3>
            </div>
            <a href="/consultant/billing" className="text-xs text-blue-600 font-medium hover:underline">
              {t('billing.credits.add_credits')}
            </a>
          </div>
          <div className="flex flex-wrap gap-4">
            {credits.map((c: any) => {
              const isUnlimited = c.balance === -1;
              const totalAmount = c.package_amount || 0;
              const pct = isUnlimited ? 100 : totalAmount > 0 ? Math.round((c.balance / totalAmount) * 100) : 0;
              const isLow = !isUnlimited && totalAmount > 0 && c.balance < (totalAmount * 0.2);
              const isEmpty = !isUnlimited && c.balance <= 0;
              const icon = c.key === 'ai_credit' ? <Zap size={14} /> : <Mail size={14} />;
              return (
                <div key={c.key} className="flex-1 min-w-[140px] p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className={isEmpty ? 'text-red-400' : isLow ? 'text-orange-400' : 'text-blue-400'}>{icon}</span>
                    <span className="text-xs font-semibold text-slate-600">{c.label_tr || c.key}</span>
                    {isEmpty && <span className="ml-auto text-[10px] font-bold text-red-500">{t('billing.credits.out_of_credit')}</span>}
                    {isLow && !isEmpty && <span className="ml-auto text-[10px] font-bold text-orange-500">{t('billing.credits.low_credit')}</span>}
                  </div>
                  <p className="text-lg font-bold text-slate-900">
                    {isUnlimited ? t('billing.credits.unlimited') : (c.balance ?? 0).toLocaleString()}
                  </p>
                  {!isUnlimited && (
                    <div className="mt-1.5 h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isEmpty ? 'bg-red-400' : isLow ? 'bg-orange-400' : 'bg-blue-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">
                    {isUnlimited ? '' : `${(totalAmount || 0).toLocaleString()} ${t('billing.credits.total')}`}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Comparison Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">{t('trainer_dashboard.comparison_table')}</h3>
            <Link href="/consultant/companies" className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">
              {t('trainer_dashboard.view_all')} <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">{t('companies.columns.name')}</th>
                  <th className="px-6 py-4 text-center">{t('companies.columns.score')}</th>
                  <th className="px-6 py-4 text-center">{t('companies.columns.participation')}</th>
                  <th className="px-6 py-4">{t('companies.columns.status')}</th>
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
                          {t(`companies.status.${c.status?.toLowerCase()}`, { defaultValue: c.status || 'new' })}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm">
                      {t('companies.empty')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Health Map / Chart & Alerts */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
          <h3 className="font-bold text-slate-900">{t('trainer_dashboard.health_map')}</h3>
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
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('trainer_dashboard.risk_alerts')}</h4>
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
                  <p className="text-xs text-emerald-800 font-medium">{t('trainer_dashboard.no_alerts')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
