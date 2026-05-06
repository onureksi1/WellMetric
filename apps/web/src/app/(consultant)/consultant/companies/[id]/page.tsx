'use client';

import React, { useEffect, useState } from 'react';
import { useT } from '@/hooks/useT';
import { 
  ArrowLeft, 
  Building2, 
  Users, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  Download,
  Calendar,
  ChevronRight,
  Filter,
  Target,
  Brain,
  Heart,
  Briefcase,
  Loader2
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import client from '@/lib/api/client';

export default function CompanyDetailPage() {
  const { t, tc } = useT('consultant');
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await client.get(`/consultant/companies/${params.id}/stats`);
        setData(response.data);
      } catch (error) {
        console.error('Error fetching company stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchStats();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium text-lg animate-pulse">{tc('analyzing')}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4 text-center">
        <div className="p-4 bg-red-50 rounded-full text-red-500 mb-2">
          <AlertTriangle size={48} />
        </div>
        <h2 className="text-xl font-bold text-slate-900">{tc('company')} {tc('not_found')}</h2>
        <p className="text-slate-500 max-w-xs">{t('companies.not_accessible_or_found', { defaultValue: 'İstediğiniz firma verilerine ulaşılamadı veya yetkiniz bulunmuyor.' })}</p>
        <Link href="/consultant/companies" className="mt-4 text-blue-600 font-bold hover:underline flex items-center gap-2">
          <ArrowLeft size={18} /> {tc('back_to_companies')}
        </Link>
      </div>
    );
  }

  // Map dimensions to UI icons
  const dimensionIcons: any = {
    'Mental Sağlık': Brain,
    'Fiziksel Sağlık': Heart,
    'İş Tatmini': Briefcase,
    'Sosyal Bağlılık': Users
  };

  const handleDownloadReport = () => {
    router.push(`/consultant/reports/new?company_id=${params.id}`);
  };

  const handleAssignSurvey = () => {
    router.push(`/consultant/surveys?company_id=${params.id}`);
  };

  const handleAiAnalysis = () => {
    router.push(`/consultant/ai?company_id=${params.id}`);
  };

  return (
    <div className="space-y-8">
      {/* Top Navigation & Header */}
      <div className="flex flex-col gap-6">
        <Link 
          href="/consultant/companies" 
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors group w-fit"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          {tc('back_to_companies')}
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 shadow-sm">
              <Building2 size={32} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">{data.company?.name}</h1>
                <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase rounded-full tracking-wider">
                  {data.company?.plan || 'Growth Plan'}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-slate-500 font-medium">
                <span className="flex items-center gap-1.5"><Target size={14} /> {data.company?.industry_label_tr || data.company?.industry || '-'}</span>
                <span className="flex items-center gap-1.5"><Users size={14} /> {data.company?.employee_count || 0} {tc('total')} {tc('employees')}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleDownloadReport}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              <Download size={18} />
              {tc('download_report')}
            </button>
            <button 
              onClick={handleAssignSurvey}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
            >
              {t('surveys.assign') || 'Değerlendirme Ata'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Dimensions & Trends */}
        <div className="lg:col-span-2 space-y-8">
          {/* Dimension Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(data.dimensions || []).map((dim: any) => {
              const Icon = dimensionIcons[dim.name] || Activity;
              return (
                <div key={dim.name} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
                      <Icon size={24} />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-900">{dim.score || '-'}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Skor</p>
                    </div>
                  </div>
                  <h4 className="font-bold text-slate-800">{dim.name}</h4>
                  <div className="mt-4 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full" 
                      style={{ width: `${dim.score || 0}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Wellbeing Trend Chart */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-bold text-slate-900">{tc('wellbeing_trend')}</h3>
                <p className="text-xs text-slate-500 font-medium">{tc('trend_subtitle')}</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold text-slate-600">
                <Calendar size={14} />
                {tc('last_6_months')}
              </div>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.trend_data || []}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12}} 
                    dy={10} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12}} 
                    domain={[0, 100]}
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#3b82f6" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorScore)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column: Key Metrics & Departments */}
        <div className="space-y-8">
          {/* Main Stats Card */}
          <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl shadow-slate-900/20 relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{tc('overall_score')}</p>
                <div className="flex items-end gap-3">
                  <span className="text-5xl font-bold">{data.company?.score || '-'}</span>
                  {data.company?.trend && (
                    <span className="text-emerald-400 text-sm font-bold mb-1.5 flex items-center gap-1">
                      <TrendingUp size={16} /> {data.company.trend}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/10">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{tc('participation')}</p>
                  <p className="text-xl font-bold">{data.company?.participation || '0'}%</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{tc('last_survey')}</p>
                  <p className="text-xl font-bold">{data.company?.last_survey_at ? new Date(data.company.last_survey_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : '-'}</p>
                </div>
              </div>

              <button 
                onClick={handleAiAnalysis}
                className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                {tc('start_ai_analysis')} <Brain size={18} />
              </button>
            </div>
            <Activity className="absolute -bottom-10 -right-10 text-white/5" size={200} />
          </div>

          {/* Department List */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">{tc('departments')}</h3>
              <button className="p-2 rounded-lg hover:bg-slate-50 text-slate-400">
                <Filter size={18} />
              </button>
            </div>
            <div className="divide-y divide-slate-50">
              {(data.departments || []).length > 0 ? (
                data.departments.map((dept: any) => (
                  <div key={dept.name} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{dept.name}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        dept.score > 70 ? 'bg-emerald-50 text-emerald-600' : 
                        dept.score > 50 ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {dept.score > 70 ? 'Healthy' : dept.score > 50 ? 'At Risk' : 'Critical'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            dept.score > 70 ? 'bg-emerald-500' : 
                            dept.score > 50 ? 'bg-orange-500' : 'bg-red-500'
                          }`} 
                          style={{ width: `${dept.score || 0}%` }} 
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-600 w-8 text-right">{dept.score || '-'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs font-medium">
                  {tc('no_department_data')}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          {data.alerts?.length > 0 && (
            <div className="bg-orange-50 rounded-3xl p-6 border border-orange-100">
              <h4 className="font-bold text-orange-900 mb-2 flex items-center gap-2">
                <AlertTriangle size={18} />
                {data.alerts[0].title}
              </h4>
              <p className="text-xs text-orange-700 leading-relaxed mb-4">
                {data.alerts[0].message}
              </p>
              <button className="text-xs font-bold text-orange-900 hover:underline flex items-center gap-1">
                {tc('create_action_plan')} <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
