'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Building2, 
  Users, 
  Activity,
  ArrowRight,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import client from '@/lib/api/client';

export default function MyCompaniesPage() {
  const { t } = useTranslation('consultant');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<any[]>([]);
  const [planLimit, setPlanLimit] = useState({ used: 0, max: 5 });

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await client.get('/consultant/companies');
        // Backend returns { data: [...], meta: { total, page, ... } }
        const list = response.data?.data ?? response.data;
        if (Array.isArray(list)) {
          setCompanies(list);
          setPlanLimit(prev => ({ ...prev, used: list.length }));
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.industry?.toLowerCase().includes(search.toLowerCase())
  );

  const isLimitReached = planLimit.used >= planLimit.max;

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium">Firmalar yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('companies.title')}</h1>
          <p className="text-slate-500">{t('companies.subtitle')}</p>
        </div>
        
        <div className="flex items-center gap-3">
          {isLimitReached && (
            <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-100 rounded-xl text-orange-700 text-sm font-medium">
              <ShieldAlert size={16} />
              {t('companies.limit_reached')}
            </div>
          )}
          <Link 
            href={isLimitReached ? '#' : '/consultant/companies/new'}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 ${
              isLimitReached 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Plus size={20} />
            {t('companies.new')}
          </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder={t('companies.search_placeholder')}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">
            <Filter size={18} />
            {t('common.filter', 'Filtrele')}
          </button>
        </div>
      </div>

      {/* Grid of Companies */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCompanies.length > 0 ? (
          filteredCompanies.map((c) => (
            <div key={c.id} className="group bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
              <div className="p-6 space-y-4">
                {/* Card Header */}
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                    <Building2 size={24} />
                  </div>
                  <button className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors">
                    <MoreVertical size={20} />
                  </button>
                </div>

                {/* Info */}
                <div>
                  <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{c.name}</h3>
                  <p className="text-sm text-slate-500">{c.industry_label_tr || c.industry || 'Sektör Belirtilmedi'}</p>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Wellbeing</p>
                    <div className="flex items-center gap-1.5">
                      <Activity size={14} className={(c.score || 0) < 60 ? 'text-red-500' : 'text-emerald-500'} />
                      <span className="text-lg font-bold text-slate-900">{c.score || '-'}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('common.employees', 'Çalışan')}</p>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Users size={14} />
                      <span className="text-lg font-bold text-slate-900">{c.employee_count || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Info */}
                <div className="flex items-center justify-between text-xs pt-2">
                  <span className="px-2 py-1 bg-slate-100 rounded text-slate-600 font-medium">{c.plan || 'Standard'}</span>
                  <span className="text-slate-400">Son: {c.last_survey_at ? new Date(c.last_survey_at).toLocaleDateString() : '-'}</span>
                </div>
              </div>

              {/* Action Overlay */}
              <Link 
                href={`/consultant/companies/${c.id}`}
                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-50 text-slate-600 text-sm font-bold hover:bg-blue-600 hover:text-white transition-all border-t border-slate-100"
              >
                {t('common.view_details', 'Detayları Gör')} <ArrowRight size={16} />
              </Link>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-slate-100">
            <Building2 className="mx-auto text-slate-200 mb-4" size={48} />
            <p className="text-slate-500 font-medium">Aradığınız kriterlere uygun firma bulunamadı.</p>
          </div>
        )}
      </div>
    </div>
  );
}
