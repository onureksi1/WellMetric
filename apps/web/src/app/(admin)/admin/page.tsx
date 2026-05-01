'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import client from '@/lib/api/client';
import { 
  Building2, 
  Users, 
  ClipboardCheck, 
  TrendingUp, 
  Bot, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  PieChart as PieIcon,
  BarChart3 as BarChartIcon,
  Search,
  Bell,
  Clock,
  ExternalLink,
  ChevronRight,
  Zap,
  Target,
  Trophy,
  AlertTriangle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
  AreaChart,
  Area,
  BarChart
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';

// --- HELPERS ---
const formatNumber = (n: number) => {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
};

const formatDelta = (current: number, prev: number) => {
  const diff = current - prev;
  if (diff > 0) return { label: `▲ ${diff.toFixed(1)}`, color: 'text-green-600' };
  if (diff < 0) return { label: `▼ ${Math.abs(diff).toFixed(1)}`, color: 'text-red-600' };
  return { label: '→', color: 'text-gray-400' };
};

const timeAgo = (date: string | Date) => {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMin < 60) return `${diffMin} dakika önce`;
  if (diffHrs < 24) return `${diffHrs} saat önce`;
  if (diffDays < 7) return `${diffDays} gün önce`;
  return past.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
};

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

import { useMediaQuery } from '@/lib/hooks/useMediaQuery';

export default function AdminDashboardPage() {
  const { t } = useTranslation('admin');
  const [activeTab, setActiveTab] = useState<'top' | 'bottom'>('top');
  const isMobile = useMediaQuery('(max-width: 768px)');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-dashboard-overview'],
    queryFn: async () => {
      const res = await client.get('/admin/dashboard/overview');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <DashboardSkeleton />;
  if (isError) return (
    <div className="flex flex-col items-center justify-center h-96 space-y-4">
      <p className="text-gray-500 font-medium">Veriler yüklenirken bir hata oluştu.</p>
      <Button onClick={() => refetch()} variant="outline">Tekrar Dene</Button>
    </div>
  );

  const metrics = data.metrics;
  const trendData = isMobile ? data.monthly_trend.slice(-6) : data.monthly_trend;
  const chartHeight = isMobile ? 250 : 350;
  const healthMapHeight = isMobile ? 300 : 400;
  const sectorChartHeight = isMobile ? 200 : 300;

  return (
    <div className="space-y-8 pb-12">
      {/* ROW 1: 6 METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard 
          icon={<Building2 size={20} />}
          label="Aktif Firma"
          value={metrics.active_companies}
          delta={formatDelta(metrics.new_this_month, metrics.new_prev_month)}
          subLabel="Bu Ay Yeni"
          href="/admin/companies"
        />
        <MetricCard 
          icon={<Activity size={20} />}
          label="Platform Ort."
          value={metrics.platform_avg_score.toFixed(1)}
          delta={formatDelta(metrics.platform_avg_score, metrics.platform_avg_score_prev)}
          subLabel="Puan Değişimi"
          href="/admin/companies"
        />
        <MetricCard 
          icon={<Users size={20} />}
          label="Toplam Çalışan"
          value={formatNumber(metrics.total_employees)}
          subLabel="Aktif Kullanıcı"
          href="/admin/companies"
        />
        <MetricCard 
          icon={<ClipboardCheck size={20} />}
          label="Katılım Oranı"
          value={`%${metrics.avg_participation_rate.toFixed(1)}`}
          delta={formatDelta(metrics.avg_participation_rate, metrics.avg_participation_prev)}
          subLabel="Genel Ortalama"
          href="/admin/surveys"
        />
        <MetricCard 
          icon={<TrendingUp size={20} />}
          label="Bu Ay Yanıt"
          value={formatNumber(metrics.total_responses_this_month)}
          delta={formatDelta(metrics.total_responses_this_month, metrics.total_responses_prev_month)}
          subLabel="Anket Yanıtı"
          href="/admin/surveys"
        />
        <MetricCard 
          icon={<Bot size={20} />}
          label="AI Insight"
          value={metrics.ai_insights_this_month}
          subLabel="Bu Ay Üretilen"
          href="/admin/audit"
        />
      </div>

      {/* ROW 2: PLATFORM TREND + DISTRIBUTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-8 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-navy flex items-center gap-2">
              <TrendingUp size={18} className="text-primary" />
              Platform Esenlik Trendi (12 Ay)
            </h3>
          </div>
          <div style={{ height: chartHeight }} className="w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: isMobile ? 10 : 12, fill: '#64748b' }} dy={10} hide={isMobile && trendData.length > 6} />
                <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
                <Bar yAxisId="left" name="Yanıt Sayısı" dataKey="response_count" fill="#dcfce7" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" name="Ort. Skor" type="monotone" dataKey="avg_score" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                <Line yAxisId="right" name="Firma Sayısı" type="monotone" dataKey="company_count" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="lg:col-span-4 space-y-6">
          <Card className="p-6">
            <h3 className="font-bold text-navy mb-4 text-sm flex items-center gap-2">
              <PieIcon size={16} className="text-primary" />
              Üyelik Planı Dağılımı
            </h3>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.plan_distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="plan"
                  >
                    {data.plan_distribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-4">
              {data.plan_distribution.map((entry: any, index: number) => (
                <div key={entry.plan} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-[10px] font-bold text-navy uppercase">{entry.plan}</span>
                  <span className="text-[10px] text-gray-400">%{entry.percentage.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-navy mb-4 text-sm flex items-center gap-2">
              <Target size={16} className="text-primary" />
              Boyut Ortalamaları
            </h3>
            <div className="space-y-3">
              {data.dimension_averages.map((dim: any) => {
                const isLowest = dim.avg_score === Math.min(...data.dimension_averages.map((d: any) => d.avg_score));
                const delta = formatDelta(dim.avg_score, dim.prev_avg_score);
                return (
                  <div key={dim.dimension} className={`flex items-center justify-between p-2 rounded-lg transition-colors ${isLowest ? 'bg-red-50 border border-red-100' : 'hover:bg-gray-50'}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getDimensionIcon(dim.dimension)}</span>
                      <span className="text-xs font-bold text-navy capitalize">{dim.dimension}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-black ${isLowest ? 'text-red-600' : 'text-navy'}`}>{dim.avg_score.toFixed(1)}</span>
                      <span className={`text-[10px] font-bold ${delta.color}`}>{delta.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* ROW 3: COMPANY HEALTH MAP (SCATTER) */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="font-bold text-navy flex items-center gap-2">
              <Activity size={18} className="text-primary" />
              Firma Sağlık Haritası
            </h3>
            <p className="text-xs text-gray-400 font-medium">Katılım Oranı vs. Wellbeing Skoru</p>
          </div>
        </div>
        <div style={{ height: healthMapHeight }} className="w-full relative">
          {/* QUADRANTS BACKGROUND */}
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 opacity-5 pointer-events-none ml-[40px] md:ml-[60px] mb-[20px] md:mb-[30px]">
            <div className="border-r border-b border-navy flex items-start justify-start p-2 md:p-4"><span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-navy">Gizli Risk?</span></div>
            <div className="border-b border-navy flex items-start justify-end p-2 md:p-4"><span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-green-600">İdeal</span></div>
            <div className="border-r border-navy flex items-end justify-start p-2 md:p-4"><span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-red-600">Kritik</span></div>
            <div className="flex items-end justify-end p-2 md:p-4"><span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-navy">Takip Et</span></div>
          </div>
          
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                type="number" 
                dataKey="participation_rate" 
                name="Katılım Oranı" 
                unit="%" 
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#64748b' }}
              />
              <YAxis 
                type="number" 
                dataKey="overall_score" 
                name="Wellbeing Skoru" 
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#64748b' }}
              />
              <ZAxis type="number" dataKey="employee_count" range={[isMobile ? 30 : 50, isMobile ? 200 : 400]} />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }} 
                content={({ active, payload }: any) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-4 rounded-xl shadow-xl border border-gray-100 min-w-[200px]">
                        <p className="font-black text-navy mb-2">{data.name}</p>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-gray-400 flex justify-between">SKOR: <span className="text-navy">{data.overall_score?.toFixed(1) || '-'}</span></p>
                          <p className="text-[10px] font-bold text-gray-400 flex justify-between">KATILIM: <span className="text-navy">%{data.participation_rate?.toFixed(1) || '-'}</span></p>
                          <p className="text-[10px] font-bold text-gray-400 flex justify-between">ÇALIŞAN: <span className="text-navy">{data.employee_count}</span></p>
                          <p className="text-[10px] font-bold text-gray-400 flex justify-between">PLAN: <span className="text-primary uppercase">{data.plan}</span></p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter name="Firmalar" data={data.company_health} onClick={(node: any) => window.location.href=`/admin/companies/${node.id || node.payload?.id}`}>
                {data.company_health.map((entry: any, index: number) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={
                      !entry.overall_score ? '#94a3b8' :
                      entry.overall_score >= 70 ? '#10b981' : 
                      entry.overall_score >= 50 ? '#f59e0b' : '#ef4444'
                    } 
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* ROW 4: SECTOR + GROWTH + PERFORMANCE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SECTOR COMPARISON */}
        <Card className="lg:col-span-4 p-6">
          <h3 className="font-bold text-navy mb-6 flex items-center gap-2">
            <BarChartIcon size={18} className="text-primary" />
            Sektör Karşılaştırması
          </h3>
          <div style={{ height: sectorChartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={data.sector_comparison}
                margin={{ left: 20 }}
                onClick={(state: any) => {
                  if (state && state.activePayload && state.activePayload.length > 0) {
                    const industry = state.activePayload[0].payload.industry;
                    if (industry) window.location.href = `/admin/companies?industry=${industry}`;
                  }
                }}
              >
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="label_tr" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: '#1e293b' }} 
                  width={100}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar 
                  dataKey="avg_score" 
                  radius={[0, 4, 4, 0]}
                  onClick={(node: any) => {
                    const industry = node.payload?.industry || node.industry;
                    if (industry) window.location.href = `/admin/companies?industry=${industry}`;
                  }}
                  className="cursor-pointer"
                >
                  {data.sector_comparison.map((entry: any, index: number) => {
                    const max = Math.max(...data.sector_comparison.map((s: any) => s.avg_score));
                    const min = Math.min(...data.sector_comparison.map((s: any) => s.avg_score));
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.avg_score === max ? '#10b981' : entry.avg_score === min ? '#ef4444' : '#3b82f6'} 
                        className="cursor-pointer"
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* GROWTH TREND */}
        <Card className="lg:col-span-4 p-6">
          <h3 className="font-bold text-navy mb-6 flex items-center gap-2">
            <Zap size={18} className="text-primary" />
            Büyüme Trendi (6 Ay)
          </h3>
          <div style={{ height: sectorChartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={isMobile ? data.growth_trend.slice(-3) : data.growth_trend}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e293b" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#1e293b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="company_count" name="Firma Sayısı" stroke="#1e293b" fillOpacity={1} fill="url(#colorCount)" strokeWidth={2} />
                <Area type="monotone" dataKey={(d) => d.employee_count / 10} name="Çalışan / 10" stroke="#10b981" fill="transparent" strokeWidth={2} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* PERFORMANCE STATS */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-5 bg-gradient-to-br from-white to-primary/5 border-primary/10">
            <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <ClipboardCheck size={12} /> Anket Performansı
            </h4>
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <p className="text-[10px] font-bold text-gray-400 mb-0.5">BU AY KAMPANYA</p>
                  <p className="text-xl font-black text-navy">{data.survey_performance.total_campaigns_this_month}</p>
               </div>
               <div>
                  <p className="text-[10px] font-bold text-gray-400 mb-0.5">ORT. TAMAMLAMA</p>
                  <p className="text-xl font-black text-primary">%{data.survey_performance.avg_completion_rate.toFixed(1)}</p>
               </div>
            </div>
            {data.survey_performance.best_campaign && (
              <div className="mt-4 pt-4 border-t border-primary/10 flex items-center justify-between">
                 <div>
                    <p className="text-[10px] font-bold text-gray-400">EN BAŞARILI</p>
                    <p className="text-xs font-black text-navy line-clamp-1">{data.survey_performance.best_campaign.company_name}</p>
                 </div>
                 <Badge variant="green">%{data.survey_performance.best_campaign.completion_rate.toFixed(1)}</Badge>
              </div>
            )}
          </Card>

          <Card className="p-5 bg-gradient-to-br from-white to-navy/5 border-navy/10">
            <h4 className="text-[10px] font-black text-navy uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <Bot size={12} /> AI Aktivite
            </h4>
            <div className="space-y-4">
               <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500">Bu Ay Üretilen Insight</span>
                  <span className="text-sm font-black text-navy">{data.ai_activity.total_insights_this_month}</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500">Risk Altındaki Firma</span>
                  <span className="text-sm font-black text-red-600">{data.ai_activity.risk_alerts_this_month}</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500">İstihbarat Raporu</span>
                  <span className="text-sm font-black text-primary">{data.ai_activity.intelligence_reports_generated}</span>
               </div>
               <div className="pt-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">EN ÇOK KULLANILAN</p>
                  <p className="text-xs font-black text-navy">{data.ai_activity.most_used_feature}</p>
               </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ROW 5: COMPANIES + ALERTS + AUDIT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COMPANY PERFORMANCE TABS */}
        <Card className="lg:col-span-5 flex flex-col">
          <div className="flex border-b">
            <button 
              onClick={() => setActiveTab('top')}
              className={`flex-1 px-6 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'top' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-gray-400 hover:text-navy'}`}
            >
              En İyi Performans ▲
            </button>
            <button 
              onClick={() => setActiveTab('bottom')}
              className={`flex-1 px-6 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'bottom' ? 'text-red-600 border-b-2 border-red-600 bg-red-50' : 'text-gray-400 hover:text-navy'}`}
            >
              Dikkat Gereken ▼
            </button>
          </div>
          <div className="p-0 overflow-x-auto">
            {/* Desktop Table */}
            <table className="hidden md:table w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase border-b">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Firma</th>
                  <th className="px-4 py-3">Sektör</th>
                  <th className="px-4 py-3 text-center">Skor</th>
                  <th className="px-4 py-3 text-center">Katılım</th>
                  <th className="px-4 py-3 text-center">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(activeTab === 'top' ? data.top_companies : data.bottom_companies).map((company: any, idx: number) => (
                  <tr key={company.id} className="hover:bg-gray-50/80 transition-colors group cursor-pointer" onClick={() => window.location.href=`/admin/companies/${company.id}`}>
                    <td className="px-4 py-4 text-xs font-bold text-gray-300">{idx + 1}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-navy group-hover:text-primary transition-colors">{company.name}</span>
                        <span className="text-[10px] text-gray-400 uppercase font-bold">{company.plan}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant="gray" className="text-[10px] font-bold uppercase">{company.industry}</Badge>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`text-sm font-black ${company.overall_score >= 70 ? 'text-green-600' : company.overall_score < 50 ? 'text-red-600' : 'text-navy'}`}>
                        {company.overall_score?.toFixed(1) || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-xs font-bold text-navy">%{company.participation_rate?.toFixed(1) || '-'}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {company.trend === 'up' && <ArrowUpRight size={16} className="text-green-500 mx-auto" />}
                      {company.trend === 'down' && <ArrowDownRight size={16} className="text-red-500 mx-auto" />}
                      {company.trend === 'stable' && <Minus size={16} className="text-gray-300 mx-auto" />}
                      {company.trend === 'new' && <Badge variant="blue" className="text-[8px] px-1 py-0">YENİ</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y">
              {(activeTab === 'top' ? data.top_companies : data.bottom_companies).map((company: any) => (
                <div key={company.id} className="p-4 space-y-3 active:bg-gray-50 transition-colors" onClick={() => window.location.href=`/admin/companies/${company.id}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-navy">{company.name}</span>
                      <span className="text-[10px] text-gray-400 uppercase font-bold">{company.plan}</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-lg font-black block ${company.overall_score >= 70 ? 'text-green-600' : company.overall_score < 50 ? 'text-red-600' : 'text-navy'}`}>
                        {company.overall_score?.toFixed(1) || '-'}
                      </span>
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-[10px] font-bold text-gray-400">TREND:</span>
                        {company.trend === 'up' && <ArrowUpRight size={12} className="text-green-500" />}
                        {company.trend === 'down' && <ArrowDownRight size={12} className="text-red-500" />}
                        {company.trend === 'stable' && <Minus size={12} className="text-gray-300" />}
                        {company.trend === 'new' && <Badge variant="blue" className="text-[8px] px-1 py-0">YENİ</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="gray" className="text-[9px] font-bold uppercase">{company.industry}</Badge>
                    <div className="text-[10px] font-bold text-navy">KATILIM: %{company.participation_rate?.toFixed(1) || '-'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Link href="/admin/companies" className="p-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-primary transition-colors border-t">
            {t('dashboard.view_all_companies')} →
          </Link>
        </Card>

        {/* ALERTS */}
        <Card className="lg:col-span-3 p-6 flex flex-col h-full">
           <h3 className="font-bold text-navy mb-6 flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-500" />
            Kritik Alarmlar
          </h3>
          <div className="flex-1 space-y-4 overflow-y-auto max-h-[400px] pr-2">
            {data.alerts.length > 0 ? data.alerts.map((alert: any, idx: number) => (
              <div key={idx} className="p-4 rounded-xl border border-red-100 bg-red-50/50 hover:bg-red-50 transition-colors group cursor-pointer" onClick={() => window.location.href=`/admin/companies/${alert.company_id}`}>
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-black text-navy">{alert.company_name}</span>
                  <Badge variant="red" className="text-[8px] px-1 py-0">KRİTİK</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">{alert.dimension}:</span>
                  <span className="text-sm font-black text-red-600">{alert.score}</span>
                  <span className="text-[10px] font-bold text-red-400">(▼{alert.delta})</span>
                </div>
                <div className="flex justify-end mt-2">
                  <span className="text-[8px] font-black text-red-600 group-hover:underline flex items-center gap-0.5">
                    FİRMAYA GİT <ChevronRight size={8} />
                  </span>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                <div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                   <Trophy size={24} />
                </div>
                <p className="text-xs font-bold text-navy">{t('dashboard.all_companies_normal')}</p>
              </div>
            )}
          </div>
        </Card>

        {/* RECENT AUDIT */}
        <Card className="lg:col-span-4 p-6 flex flex-col h-full">
          <h3 className="font-bold text-navy mb-6 flex items-center gap-2">
            <Clock size={18} className="text-primary" />
            {t('dashboard.recent_actions')}
          </h3>
          <div className="flex-1 space-y-4 overflow-y-auto max-h-[400px] pr-2">
            {data.recent_audit.map((log: any, idx: number) => (
              <div key={idx} className="flex gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => window.location.href=`/admin/audit?company_id=${log.company_id || ''}`}>
                <div className={`h-10 w-10 rounded-xl shrink-0 flex items-center justify-center ${getAuditColor(log.action)}`}>
                   {getAuditIcon(log.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    <p className="text-xs font-black text-navy line-clamp-1">{log.action}</p>
                    <span className="text-[8px] font-bold text-gray-400 whitespace-nowrap">{timeAgo(log.created_at)}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-medium truncate">{log.user_email}</p>
                  {log.company_name && <p className="text-[10px] font-bold text-primary mt-1">{log.company_name}</p>}
                </div>
              </div>
            ))}
          </div>
          <Link href="/admin/audit" className="mt-6 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-primary transition-colors border-t pt-4">
            {t('dashboard.view_all_audit_logs')} →
          </Link>
        </Card>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function MetricCard({ icon, label, value, delta, subLabel, href }: any) {
  return (
    <Link href={href}>
      <Card className="p-5 hover:border-primary/30 transition-all group cursor-pointer h-full border-gray-100 shadow-sm hover:shadow-md">
        <div className="flex items-center gap-3 mb-4">
           <div className="h-10 w-10 bg-gray-50 group-hover:bg-primary/5 text-gray-400 group-hover:text-primary rounded-xl flex items-center justify-center transition-colors">
              {icon}
           </div>
           <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
              <span className="text-xl font-black text-navy">{value}</span>
           </div>
        </div>
        <div className="flex items-center gap-2">
           {delta && <span className={`text-[10px] font-black ${delta.color}`}>{delta.label}</span>}
           <span className="text-[10px] font-bold text-gray-400">{subLabel}</span>
        </div>
      </Card>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-12 gap-6">
        <Skeleton className="col-span-8 h-[400px] rounded-3xl" />
        <div className="col-span-4 space-y-6">
          <Skeleton className="h-[180px] rounded-3xl" />
          <Skeleton className="h-[200px] rounded-3xl" />
        </div>
      </div>
      <Skeleton className="h-[400px] rounded-3xl" />
    </div>
  );
}

function getDimensionIcon(dim: string) {
  switch (dim.toLowerCase()) {
    case 'physical':
    case 'fiziksel': return '💪';
    case 'mental':
    case 'zihinsel': return '🧠';
    case 'social':
    case 'sosyal': return '🤝';
    case 'financial':
    case 'finansal': return '💰';
    case 'work':
    case 'is_ve_anlam': return '✨';
    default: return '📊';
  }
}

function getAuditColor(action: string) {
  if (action.includes('delete')) return 'bg-red-50 text-red-600';
  if (action.includes('settings') || action.includes('api_key')) return 'bg-orange-50 text-orange-600';
  if (action.includes('ai')) return 'bg-purple-50 text-purple-600';
  if (action.includes('survey')) return 'bg-blue-50 text-blue-600';
  return 'bg-gray-50 text-gray-400';
}

function getAuditIcon(action: string) {
  if (action.includes('delete')) return <AlertTriangle size={16} />;
  if (action.includes('settings')) return <Search size={16} />;
  if (action.includes('ai')) return <Bot size={16} />;
  if (action.includes('survey')) return <ClipboardCheck size={16} />;
  return <Clock size={16} />;
}
