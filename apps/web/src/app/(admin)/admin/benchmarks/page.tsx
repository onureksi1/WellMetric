'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Search, 
  Filter, 
  Globe, 
  Building2, 
  Save, 
  RefreshCcw, 
  History,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Sparkles,
  Bot
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'react-hot-toast';
import client from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import { handleApiError } from '@/lib/utils/error-handler';

const DIMENSIONS = ['overall', 'physical', 'mental', 'social', 'financial', 'work'];

export default function AdminBenchmarksPage() {
  const router = useRouter();
  const [benchmarks, setBenchmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [industry, setIndustry] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBenchmarks();
  }, [industry]);

  const [generatingAi, setGeneratingAi] = useState(false);

  const handleAiGenerate = async () => {
    if (!industry) {
      toast.error('Lütfen önce bir sektör seçin.');
      return;
    }
    setGeneratingAi(true);
    try {
      const res = await client.post('/admin/benchmarks/ai-generate', { industry, region: 'turkey' });
      const suggestions = res.data;
      
      // We could show a modal, but for now let's just toast and log
      console.log('AI Suggestions:', suggestions);
      toast.success('AI sektörel verileri analiz etti. Önerileri aşağıda görebilirsiniz.');
      
      // In a real scenario, we might want to show these in a preview
      // For now, let's just alert the user
      alert('AI Önerileri:\n' + suggestions.map((s: any) => `${s.dimension}: ${s.score} (${s.source})`).join('\n'));
      
    } catch (error) {
      handleApiError(error, 'AI analizi başarısız oldu.');
    } finally {
      setGeneratingAi(false);
    }
  };

  const fetchBenchmarks = async () => {
    setLoading(true);
    try {
      const res = await client.get('/admin/benchmarks', { params: { industry } });
      setBenchmarks(res.data);
    } catch (error) {
      handleApiError(error, 'Benchmark verileri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string, updatedData: any) => {
    setSavingId(id);
    try {
      await client.put('/admin/benchmarks', {
        industry: updatedData.industry,
        region: updatedData.region,
        dimension: updatedData.dimension,
        score: Number(updatedData.score),
        source: updatedData.source
      });
      toast.success('Değer başarıyla güncellendi.');
      fetchBenchmarks();
    } catch (error) {
      handleApiError(error, 'Güncelleme sırasında bir hata oluştu.');
    } finally {
      setSavingId(null);
    }
  };

  const handleReset = async (id: string) => {
    if (!confirm('Bu değeri orijinal seed verisine sıfırlamak istediğinizden emin misiniz?')) return;
    try {
      await client.patch(`/admin/benchmarks/${id}/reset`);
      toast.success('Değer seed verisine sıfırlandı.');
      fetchBenchmarks();
    } catch (error) {
      handleApiError(error, 'Sıfırlama başarısız oldu.');
    }
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-navy flex items-center gap-3">
            <BarChart3 className="text-primary" size={32} />
            Sektörel Benchmark Yönetimi
          </h1>
          <p className="text-slate-500 font-medium">Platform geneli sektör ortalamalarını ve araştırma verilerini yönetin.</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6 border-none shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select 
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-bold text-navy outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
            >
              <option value="">Tüm Sektörler</option>
              <option value="technology">Teknoloji</option>
              <option value="finance">Finans & Sigorta</option>
              <option value="healthcare">Sağlık</option>
              <option value="manufacturing">Üretim & Sanayi</option>
              <option value="retail">Perakende & Hizmet</option>
              <option value="education">Eğitim</option>
              <option value="logistics">Lojistik & Taşımacılık</option>
              <option value="media">Medya & İletişim</option>
              <option value="construction">İnşaat & Gayrimenkul</option>
              <option value="tourism">Turizm & Otelcilik</option>
              <option value="energy">Enerji & Madencilik</option>
              <option value="public">Kamu & STK</option>
            </select>
          </div>
          <Button variant="ghost" onClick={fetchBenchmarks} className="w-12 h-12 rounded-2xl border border-slate-200">
             <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
        
        <div className="flex gap-4">
           <button 
             onClick={handleAiGenerate}
             disabled={generatingAi}
             className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl border border-indigo-400 shadow-lg shadow-indigo-200 text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
           >
             {generatingAi ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
             <span className="text-[10px] font-black uppercase tracking-wider">AI ANALİZ & ÖNERİ</span>
           </button>

           <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-xl border border-purple-100">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="text-[10px] font-black text-purple-700 uppercase">SEED (ARAŞTIRMA)</span>
           </div>
           <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl border border-blue-100">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[10px] font-black text-blue-700 uppercase">MANUEL (GÜNCEL)</span>
           </div>
        </div>
      </Card>

      {/* Main Table */}
      <Card className="overflow-hidden border-none shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sektör / Bölge</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Boyut</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-24">Skor</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kaynak Açıklaması</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <Loader2 className="animate-spin text-primary mx-auto mb-4" size={40} />
                    <p className="text-slate-400 font-medium italic">Benchmark verileri getiriliyor...</p>
                  </td>
                </tr>
              ) : benchmarks.length > 0 ? (
                benchmarks.map((row) => (
                  <BenchmarkRow 
                    key={row.id} 
                    row={row} 
                    onUpdate={(data) => handleUpdate(row.id, data)}
                    onReset={() => handleReset(row.id)}
                    isSaving={savingId === row.id}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-400">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function BenchmarkRow({ row, onUpdate, onReset, isSaving }: { row: any, onUpdate: (data: any) => void, onReset: () => void, isSaving: boolean }) {
  const [score, setScore] = useState(row.score);
  const [source, setSource] = useState(row.source || '');
  const isChanged = Number(score) !== Number(row.score) || source !== (row.source || '');

  return (
    <tr className="hover:bg-slate-50/50 transition-colors group">
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className="text-sm font-black text-navy uppercase tracking-tighter">{row.industry}</span>
          <div className="flex items-center gap-2 mt-1">
            {row.region === 'turkey' ? (
              <Badge className="bg-red-50 text-red-600 border-none text-[9px] font-black px-1.5 py-0">TR</Badge>
            ) : (
              <Badge className="bg-blue-50 text-blue-600 border-none text-[9px] font-black px-1.5 py-0">GLOBAL</Badge>
            )}
            {row.is_seed ? (
              <span className="text-[9px] font-bold text-purple-400 italic">Seed</span>
            ) : (
              <span className="text-[9px] font-bold text-blue-400 flex items-center gap-1">
                <CheckCircle2 size={10} /> Manuel
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <Badge variant="gray" className="text-[10px] font-bold border-slate-200 text-slate-500 uppercase tracking-tighter bg-transparent">
          {row.dimension}
        </Badge>
      </td>
      <td className="px-6 py-4">
        <input 
          type="number" 
          value={score}
          onChange={(e) => setScore(e.target.value)}
          className="w-20 px-3 py-2 rounded-xl border border-slate-200 text-sm font-black text-navy focus:ring-2 focus:ring-primary/20 outline-none"
        />
      </td>
      <td className="px-6 py-4">
        <input 
          type="text" 
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Kaynak örn: Gallup 2024"
          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 focus:ring-2 focus:ring-primary/20 outline-none"
        />
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
           {!row.is_seed && (
             <Button 
               variant="ghost" 
               size="sm" 
               onClick={onReset}
               className="text-slate-400 hover:text-purple-600 hover:bg-purple-50"
               title="Seed verisine sıfırla"
             >
               <History size={16} />
             </Button>
           )}
           <Button 
             size="sm" 
             disabled={!isChanged || isSaving}
             onClick={() => onUpdate({ ...row, score, source })}
             className={`${isChanged ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-slate-100 text-slate-400'} gap-2 rounded-xl px-4`}
           >
             {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
             Kaydet
           </Button>
        </div>
      </td>
    </tr>
  );
}
