'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Library, 
  Search, 
  Filter, 
  Download, 
  BrainCircuit, 
  User as UserIcon, 
  Building2, 
  Calendar,
  ChevronRight,
  BarChart3,
  Globe,
  Loader2
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'react-hot-toast';
import client from '@/lib/api/client';

export default function SurveyPoolPage() {
  const router = useRouter();
  const [surveys, setSurveys] = useState([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({
    industry: '',
    dimension: '',
    page: 1,
    limit: 20
  });

  useEffect(() => {
    fetchStats();
    fetchSurveys();
  }, [filters]);

  const fetchStats = async () => {
    try {
      const res = await client.get('/admin/survey-pool/stats');
      setStats(res.data);
    } catch (error) {
      console.error('Stats fetch failed', error);
    }
  };

  const fetchSurveys = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.industry) params.append('industry', filters.industry);
      if (filters.dimension) params.append('dimension', filters.dimension);
      params.append('page', filters.page.toString());
      params.append('limit', filters.limit.toString());

      const res = await client.get(`/admin/survey-pool?${params.toString()}`);
      setSurveys(res.data.data);
    } catch (error) {
      toast.error('Anketler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (filters.industry) params.append('industry', filters.industry);
      if (filters.dimension) params.append('dimension', filters.dimension);

      const res = await client.get(`/admin/survey-pool/export?${params.toString()}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `survey-pool-export-${new Date().getTime()}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('AI Eğitim verisi başarıyla indirildi.');
    } catch (error) {
      toast.error('Export işlemi başarısız oldu.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-navy flex items-center gap-3">
            <Library className="text-primary" size={32} />
            Anket Havuzu
          </h1>
          <p className="text-slate-500 font-medium">Consultant'lar tarafından paylaşılan sektörel anket kütüphanesi.</p>
        </div>
        <Button 
          onClick={handleExport} 
          disabled={exporting}
          className="bg-navy text-white hover:bg-navy/90 gap-2 h-12 px-6 rounded-2xl shadow-xl shadow-navy/10"
        >
          {exporting ? <Loader2 className="animate-spin" size={20} /> : <BrainCircuit size={20} />}
          AI İçin Export (.json)
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-gradient-to-br from-white to-blue-50/50 border-none shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
                <Globe size={28} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Toplam Anket</p>
                <h3 className="text-3xl font-black text-navy">{stats.total}</h3>
              </div>
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-white to-purple-50/50 border-none shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-200">
                <Building2 size={28} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Aktif Sektör</p>
                <h3 className="text-3xl font-black text-navy">{stats.by_industry?.length || 0}</h3>
              </div>
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-white to-orange-50/50 border-none shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-200">
                <UserIcon size={28} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Katılımcı Consultant</p>
                <h3 className="text-3xl font-black text-navy">{stats.top_consultants?.length || 0}</h3>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters & List */}
      <Card className="overflow-hidden border-none shadow-sm">
        <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select 
                value={filters.industry}
                onChange={e => setFilters(f => ({ ...f, industry: e.target.value, page: 1 }))}
                className="pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-navy focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer min-w-[200px]"
              >
                <option value="">Tüm Sektörler</option>
                {stats?.by_industry?.map((i: any) => (
                  <option key={i.industry} value={i.industry}>{i.industry} ({i.count})</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <BarChart3 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select 
                value={filters.dimension}
                onChange={e => setFilters(f => ({ ...f, dimension: e.target.value, page: 1 }))}
                className="pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-navy focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer min-w-[180px]"
              >
                <option value="">Tüm Boyutlar</option>
                {['physical','mental','social','financial','work'].map(d => (
                  <option key={d} value={d}>{d.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-white px-4 py-2 rounded-lg border border-slate-100">
            {surveys.length} Kayıt Gösteriliyor
          </div>
        </div>

        <div className="divide-y divide-slate-50">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-400">
              <Loader2 className="animate-spin text-primary" size={40} />
              <p className="font-medium italic tracking-wide">Havuz verileri taranıyor...</p>
            </div>
          ) : surveys.length > 0 ? (
            surveys.map((survey: any) => (
              <div 
                key={survey.id}
                onClick={() => router.push(`/admin/survey-pool/${survey.id}`)}
                className="p-6 hover:bg-slate-50 transition-all group cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:border-primary/20 group-hover:shadow-lg group-hover:shadow-primary/5 transition-all">
                    <Library size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-navy group-hover:text-primary transition-colors">{survey.title_tr}</h4>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-slate-500 font-medium">
                      <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-md">
                        <UserIcon size={14} /> {survey.created_by_user?.full_name}
                      </span>
                      <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-md">
                        <Building2 size={14} /> {survey.company?.industry || 'Genel'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-black text-navy uppercase tracking-tighter">{survey.questions?.length || 0} SORU</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5 flex items-center justify-end gap-1 uppercase">
                      <Calendar size={10} />
                      {new Date(survey.pool_added_at).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 group-hover:bg-primary group-hover:text-white transition-all">
                    <ChevronRight size={24} />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center space-y-4">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                <Search size={40} />
              </div>
              <p className="text-slate-400 font-medium italic">Seçilen filtrelere uygun anket bulunamadı.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
