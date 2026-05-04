'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BarChart3, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  MessageSquare,
  ChevronRight,
  Filter,
  EyeOff
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import client from '@/lib/api/client';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function OnboardingDashboard() {
  const [activeTab, setActiveTab] = useState<'employees' | 'results'>('employees');
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedWave, setSelectedWave] = useState(1);
  const [waveResults, setWaveResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await client.get('/hr/onboarding/employees');
      setEmployees(res.data.data);
    } catch (error) {
      console.error('Fetch employees error', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWaveResults = async (waveNum: number) => {
    setWaveResults(null);
    try {
      const res = await client.get(`/hr/onboarding/results/${waveNum}`);
      setWaveResults(res.data.data);
    } catch (error) {
      console.error('Fetch results error', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'results') {
      fetchWaveResults(selectedWave);
    }
  }, [activeTab, selectedWave]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 border-none px-2 py-0.5 text-[10px] font-black uppercase"><CheckCircle2 size={10} className="mr-1" /> Tamamladı</Badge>;
      case 'sent':
        return <Badge className="bg-blue-100 text-blue-700 border-none px-2 py-0.5 text-[10px] font-black uppercase"><Clock size={10} className="mr-1" /> Gönderildi</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-400 border-none px-2 py-0.5 text-[10px] font-black uppercase">Bekliyor</Badge>;
    }
  };

  if (loading) return <div className="p-8 space-y-4"><Skeleton className="h-12 w-1/4" /><Skeleton className="h-64 rounded-3xl" /></div>;

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-navy flex items-center gap-3">
          <Users className="text-primary" size={32} />
          Onboarding Takibi
        </h1>
        <p className="text-slate-500 font-medium">Yeni işe başlayanların ilk 90 gün deneyimini yönetin.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('employees')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'employees' ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-navy'}`}
        >
          Çalışan Takibi
        </button>
        <button 
          onClick={() => setActiveTab('results')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'results' ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-navy'}`}
        >
          Dalga Sonuçları
        </button>
      </div>

      {activeTab === 'employees' ? (
        <Card className="border-none shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Çalışan</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Başlangıç</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">1. Gün</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">30. Gün</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">90. Gün</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {employees.map((emp) => (
                  <tr key={emp.user_id} className="group hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {emp.full_name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-navy">{emp.full_name}</p>
                          <p className="text-[11px] text-slate-400">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-600">
                        {emp.start_date ? format(new Date(emp.start_date), 'dd MMM yyyy', { locale: tr }) : '—'}
                      </span>
                    </td>
                    {[1, 2, 3].map((wave) => {
                      const waveData = emp.waves.find((w: any) => w.wave_number === wave);
                      return (
                        <td key={wave} className="px-6 py-4 text-center">
                          {waveData ? getStatusBadge(waveData.status) : <span className="text-slate-300">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Wave Selector */}
          <div className="flex gap-4">
            {[
              { id: 1, label: '1. Gün', icon: Calendar },
              { id: 2, label: '30. Gün', icon: Clock },
              { id: 3, label: '90. Gün', icon: BarChart3 }
            ].map((w) => (
              <button
                key={w.id}
                onClick={() => setSelectedWave(w.id)}
                className={`flex items-center gap-2 px-6 py-4 rounded-3xl border-2 transition-all ${selectedWave === w.id ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'}`}
              >
                <w.icon size={20} />
                <span className="font-bold">{w.label}</span>
              </button>
            ))}
          </div>

          {/* Results Area */}
          {!waveResults ? (
            <div className="space-y-4">
              <Skeleton className="h-40 rounded-3xl" />
              <Skeleton className="h-40 rounded-3xl" />
            </div>
          ) : waveResults.message ? (
            <Card className="p-12 text-center border-none shadow-sm flex flex-col items-center justify-center space-y-4 bg-white rounded-[40px]">
              <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                <EyeOff size={40} />
              </div>
              <h3 className="text-xl font-black text-navy">Gizlilik Koruması Aktif</h3>
              <p className="text-slate-500 max-w-sm mx-auto font-medium">
                Sonuçların gösterilmesi için en az {waveResults.threshold} yanıt gerekiyor. Şu anki katılım: {waveResults.completed_count}
              </p>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-full">
                Yarı Anonim Sistem
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                   <div className="h-10 w-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                     <CheckCircle2 size={24} />
                   </div>
                   <div>
                     <p className="text-sm font-bold text-navy">{waveResults.completed_count} Katılımcı</p>
                     <p className="text-[11px] text-slate-400 font-medium">Yanıtlar anonim olarak toplanmıştır.</p>
                   </div>
                </div>
              </div>

              {waveResults.results.map((q: any) => (
                <Card key={q.question_id} className="p-8 border-none shadow-sm space-y-6 bg-white rounded-[32px]">
                   <h4 className="text-md font-bold text-navy flex items-start gap-3">
                     <span className="h-6 w-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] text-slate-500 shrink-0 mt-0.5">Q</span>
                     {q.question_text}
                   </h4>

                   {q.question_type === 'open_text' ? (
                     <div className="space-y-3">
                       {q.answers.length > 0 ? q.answers.map((text: string, i: number) => (
                         <div key={i} className="p-4 bg-slate-50/50 rounded-2xl text-sm text-slate-600 border border-slate-100 font-medium leading-relaxed italic">
                           "{text}"
                         </div>
                       )) : (
                         <div className="text-sm text-slate-400 font-medium italic">Henüz yorum yapılmamış.</div>
                       )}
                     </div>
                   ) : (
                     <div className="flex items-end gap-4">
                        <div className="text-5xl font-black text-primary tracking-tighter">
                          {q.average || '—'}
                        </div>
                        <div className="pb-2">
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                            {q.question_type === 'likert5' ? 'Ortalama Skor / 5' : 'Ortalama'}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{q.count} YANIT</p>
                        </div>
                        
                        {/* Simple Visual Bar */}
                        {q.average && (
                          <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden mb-2 ml-8 max-w-xs">
                            <div 
                              className="h-full bg-primary transition-all duration-1000" 
                              style={{ width: `${(q.average / (q.question_type === 'likert5' ? 5 : 1)) * 100}%` }}
                            />
                          </div>
                        )}
                     </div>
                   )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
