'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Mail, 
  TrendingUp, 
  CheckCircle2, 
  MousePointer2, 
  Building2, 
  Filter, 
  Download,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Layers
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  Legend,
  ComposedChart
} from 'recharts';
import { format } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';

import client from '@/lib/api/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';

export default function AdminCampaignReportsPage() {
  const { t, i18n } = useTranslation('admin');
  const dateLocale = i18n.language === 'tr' ? tr : enUS;
  const [filters, setFilters] = useState({ period: '', company_id: '' });

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['admin-campaign-stats', filters],
    queryFn: async () => {
      const { data } = await client.get('/admin/campaigns/stats', { params: filters });
      return data;
    }
  });

  const { data: campaigns, isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ['admin-campaigns', filters],
    queryFn: async () => {
      const { data } = await client.get('/admin/campaigns', { params: filters });
      return data;
    }
  });

  // Mock data for Monthly Trend
  const trendData = [
    { month: 'Kas', count: 120, rate: 65 },
    { month: 'Ara', count: 150, rate: 62 },
    { month: 'Oca', count: 180, rate: 68 },
    { month: 'Şub', count: 210, rate: 71 },
    { month: 'Mar', count: 240, rate: 75 },
    { month: 'Nis', count: 320, rate: 79 },
  ];

  // Mock data for Company Comparison
  const companyComparison = [
    { name: 'TechFlow A.Ş.', campaigns: 4, sent: 870, open: 94, click: 82, comp: 79 },
    { name: 'DataSoft Ltd.', campaigns: 3, sent: 450, open: 88, click: 71, comp: 68 },
    { name: 'RetailCo', campaigns: 4, sent: 1200, open: 76, click: 60, comp: 55 },
    { name: 'InnoTech', campaigns: 2, sent: 340, open: 92, click: 85, comp: 81 },
  ];

  if (isLoadingStats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-navy">{t('campaigns.header_title')}</h1>
          <p className="text-gray-500">{t('campaigns.header_subtitle')}</p>
        </div>
        <Button variant="secondary" className="gap-2">
          <Download size={18} /> {t('campaigns.global_report')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label={t('campaigns.stats.total_sent')} value="1,240" subValue={`+12% ${t('common:vs_previous')}`} icon={<Mail className="text-blue-500" />} trend="up" />
        <StatCard label={t('campaigns.stats.avg_open_rate')} value={`%${stats.avg_open_rate || 86.3}`} subValue={`-2% ${t('common:vs_previous')}`} icon={<TrendingUp className="text-yellow-500" />} trend="down" />
        <StatCard label={t('campaigns.stats.avg_click_rate')} value="%72.1" subValue={`+5% ${t('common:vs_previous')}`} icon={<MousePointer2 className="text-primary" />} trend="up" />
        <StatCard label={t('campaigns.stats.avg_completion_rate')} value={`%${stats.avg_completion_rate || 69.4}`} subValue={`+8% ${t('common:vs_previous')}`} icon={<CheckCircle2 className="text-green-500" />} trend="up" />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 space-y-6">
           <div className="flex justify-between items-center">
              <h3 className="font-black text-navy flex items-center gap-2">
                <Layers size={20} className="text-primary" /> {t('campaigns.trend_title')}
              </h3>
              <div className="flex gap-4">
                 <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-primary" /><span className="text-[10px] font-bold text-gray-400 uppercase">{t('campaigns.sent_mail')}</span></div>
                 <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-green-500" /><span className="text-[10px] font-bold text-gray-400 uppercase">{t('campaigns.completed')} %</span></div>
              </div>
           </div>
           <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                 <ComposedChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#999' }} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#999' }} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#999' }} />
                    <Tooltip 
                       contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                       itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Bar yAxisId="left" dataKey="count" fill="#4CAF7D" radius={[6, 6, 0, 0]} barSize={40} />
                    <Line yAxisId="right" type="monotone" dataKey="rate" stroke="#2E865A" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: 'white' }} />
                 </ComposedChart>
              </ResponsiveContainer>
           </div>
        </Card>

        <Card className="p-6 space-y-6">
           <h3 className="font-black text-navy flex items-center gap-2">
             <Building2 size={20} className="text-primary" /> {t('campaigns.comparison_title')}
           </h3>
           <div className="space-y-4 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
              {companyComparison.map((comp) => (
                <div key={comp.name} className="p-4 bg-gray-50 rounded-2xl space-y-3">
                   <div className="flex justify-between items-start">
                      <span className="text-sm font-black text-navy">{comp.name}</span>
                      <Badge variant={comp.comp >= 70 ? 'green' : comp.comp >= 50 ? 'yellow' : 'red'}>
                        %{comp.comp} {t('campaigns.completed')}
                      </Badge>
                   </div>
                   <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-primary h-full transition-all" style={{ width: `${comp.comp}%` }} />
                   </div>
                   <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                      <span>{comp.sent} {t('campaigns.sent_mail')}</span>
                      <span>{comp.campaigns} {t('campaigns.campaign_count')}</span>
                   </div>
                </div>
              ))}
           </div>
        </Card>
      </div>

      {/* All Campaigns List */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
           <h3 className="font-black text-navy flex items-center gap-2">
              <Calendar size={18} className="text-primary" /> {t('campaigns.table_title')}
           </h3>
           <div className="flex gap-2">
              <select className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs font-bold text-navy outline-none">
                <option value="">{t('campaigns.all_companies')}</option>
              </select>
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white">
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">{t('campaigns.columns.company')} / {t('campaigns.columns.survey')}</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">{t('campaigns.columns.period')}</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">{t('campaigns.columns.recipients')}</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">{t('campaigns.columns.open_rate')} %</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">{t('campaigns.columns.completion_rate')} %</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">{t('campaigns.columns.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {campaigns?.items?.map((c: any) => (
                <tr key={c.id} className="hover:bg-gray-50/30 transition-colors cursor-pointer" onClick={() => window.location.href = `/admin/companies/${c.companyId}`}>
                  <td className="p-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-navy">{c.company?.name || t('common:company')}</span>
                      <span className="text-xs text-gray-400">{c.survey?.title_tr}</span>
                    </div>
                  </td>
                  <td className="p-6 text-center text-sm font-medium text-gray-500">
                    {c.period || format(new Date(c.created_at), 'MMM yyyy', { locale: dateLocale })}
                  </td>
                  <td className="p-6 text-center font-bold text-navy">{c.total_recipients}</td>
                  <td className="p-6 text-center">
                    <span className="font-black text-navy">%{c.open_rate}</span>
                  </td>
                  <td className="p-6 text-center">
                    <span className={`font-black ${c.completion_rate >= 70 ? 'text-green-600' : c.completion_rate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                      %{c.completion_rate}
                    </span>
                  </td>
                  <td className="p-6 text-center">
                    <Badge variant={c.status === 'sent' ? 'green' : 'gray'}>{c.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function StatCard({ label, value, subValue, icon, trend }: { label: string; value: any; subValue: string; icon: React.ReactNode; trend: 'up' | 'down' }) {
  return (
    <Card className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
          {icon}
        </div>
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
      </div>
      <div>
        <h3 className="text-3xl font-black text-navy">{value}</h3>
        <div className="flex items-center gap-1 mt-1">
          {trend === 'up' ? <ArrowUpRight size={14} className="text-green-500" /> : <ArrowDownRight size={14} className="text-red-500" />}
          <span className={`text-[10px] font-bold ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>{subValue}</span>
        </div>
      </div>
    </Card>
  );
}
