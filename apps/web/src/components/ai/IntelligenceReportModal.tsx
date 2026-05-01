'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  FileText, 
  BarChart2, 
  Users, 
  UserCircle, 
  MessageCircle, 
  AlertTriangle, 
  Trophy, 
  Zap, 
  TrendingUp,
  Download,
  ChevronRight,
  Plus,
  Eye
} from 'lucide-react';
import client from '@/lib/api/client';
import { toast } from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  report: any;
  period: string;
}

const tabs = [
  { id: 'summary', label: 'Özet', icon: FileText },
  { id: 'dimensions', label: 'Boyutlar', icon: BarChart2 },
  { id: 'departments', label: 'Departmanlar', icon: Users },
  { id: 'segments', label: 'Segmentler', icon: UserCircle },
  { id: 'voice', label: 'Çalışan Sesi', icon: MessageCircle },
  { id: 'risks', label: 'Riskler', icon: AlertTriangle },
  { id: 'success', label: 'Başarılar', icon: Trophy },
  { id: 'actions', label: 'Aksiyon Planı', icon: Zap },
  { id: 'forecast', label: 'Tahmin', icon: TrendingUp },
];

export const IntelligenceReportModal: React.FC<Props> = ({ isOpen, onClose, report, period }) => {
  const [activeTab, setActiveTab] = useState('summary');

  if (!report) return null;

  const handleCreateAction = async (action: any) => {
    try {
      await client.post('/hr/actions', {
        title: action.title,
        target_dimension: action.target_dimension,
        target_department: action.target_department,
        status: 'planned',
        priority: 'high'
      });
      toast.success('Aksiyon başarıyla oluşturuldu.');
    } catch (e) {
      toast.error('Aksiyon oluşturulamadı.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${period} İstihbarat Raporu`} size="xl">
      <div className="flex h-[calc(100vh-200px)]">
        {/* Sidebar Tabs */}
        <div className="w-64 border-r border-gray-100 flex flex-col p-4 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
          <div className="pt-8 mt-auto">
             <Button variant="outline" className="w-full gap-2 border-gray-200" onClick={() => window.print()}>
                <Download size={16} /> PDF Olarak İndir
             </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50/30">
          {activeTab === 'summary' && (
            <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="space-y-4">
                <h2 className="text-2xl font-black text-navy">Yönetici Özeti</h2>
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm leading-relaxed text-navy whitespace-pre-wrap">
                  {report.executive_summary}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dimensions' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4">
              {report.dimension_analysis.map((dim: any, idx: number) => (
                <div key={idx} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-black text-navy uppercase tracking-widest text-xs">{dim.dimension}</h3>
                    <Badge variant={dim.delta > 0 ? 'green' : 'red'}>
                      {dim.delta > 0 ? '+' : ''}{dim.delta}
                    </Badge>
                  </div>
                  <div className="flex items-end gap-3">
                    <span className="text-4xl font-black text-navy">{dim.score}</span>
                    <span className="text-xs text-gray-400 font-bold mb-1">GEÇEN AY: {dim.prev_score}</span>
                  </div>
                  <div className="pt-4 border-t border-gray-50 space-y-2">
                    <p className="text-xs font-bold text-gray-500">AI YORUMU</p>
                    <p className="text-sm text-navy leading-relaxed italic">"{dim.ai_comment}"</p>
                  </div>
                  <div className="bg-primary/5 p-3 rounded-xl border border-primary/10">
                    <p className="text-[10px] font-bold text-primary uppercase mb-1">TAVSİYE</p>
                    <p className="text-xs text-navy font-medium">{dim.recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'departments' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <section className="space-y-4">
                <h3 className="text-sm font-black text-green-600 uppercase tracking-widest flex items-center gap-2">
                  <Trophy size={16} /> En İyi Performans Gösterenler
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {report.department_analysis.best_performers.map((p: any, i: number) => (
                    <div key={i} className="bg-white p-5 rounded-2xl border border-green-100 shadow-sm">
                      <p className="text-xs font-bold text-gray-400 mb-1">{p.key_strength}</p>
                      <h4 className="font-black text-navy text-lg">{p.name}</h4>
                      <p className="text-2xl font-black text-green-600">{p.score}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-black text-red-600 uppercase tracking-widest flex items-center gap-2">
                  <AlertTriangle size={16} /> Risk Altındaki Departmanlar
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {report.department_analysis.at_risk.map((r: any, i: number) => (
                    <div key={i} className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-black text-navy text-lg">{r.name}</h4>
                        <Badge variant="red">{r.urgency.toUpperCase()}</Badge>
                      </div>
                      <p className="text-2xl font-black text-red-600 mb-2">{r.score}</p>
                      <p className="text-xs font-medium text-gray-600">{r.primary_risk}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'segments' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
              {report.segment_insights.map((s: any, i: number) => (
                <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                   <div className="h-10 w-10 bg-navy text-white rounded-xl flex items-center justify-center">
                      <UserCircle size={20} />
                   </div>
                   <h3 className="text-lg font-black text-navy uppercase">{s.segment_type} ANALİZİ</h3>
                   <p className="text-sm text-navy leading-relaxed font-bold">{s.finding}</p>
                   <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Hipotez</p>
                      <p className="text-sm text-gray-600 italic leading-relaxed">{s.hypothesis}</p>
                   </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'voice' && (
            <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="grid grid-cols-3 gap-4">
                 <SentimentCard label="Pozitif" value={report.employee_voice.sentiment_breakdown.positive} color="green" />
                 <SentimentCard label="Negatif" value={report.employee_voice.sentiment_breakdown.negative} color="red" />
                 <SentimentCard label="Nötr" value={report.employee_voice.sentiment_breakdown.neutral} color="gray" />
              </div>
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                 <h3 className="font-black text-navy mb-4 flex items-center gap-2">
                    <MessageCircle size={18} className="text-primary" /> Çalışan Anlatısı
                 </h3>
                 <p className="text-sm text-navy leading-relaxed whitespace-pre-wrap">{report.employee_voice.narrative}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {report.employee_voice.anonymous_quotes.map((q: any, i: number) => (
                    <div key={i} className="bg-white p-4 rounded-2xl border-l-4 border-primary shadow-sm italic text-xs text-gray-500">
                       "{q}"
                    </div>
                 ))}
              </div>
            </div>
          )}

          {activeTab === 'risks' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              {report.risk_assessment.critical_risks.map((r: any, i: number) => (
                <div key={i} className="bg-white p-6 rounded-3xl border-2 border-red-50 flex gap-6 items-start">
                   <div className="h-12 w-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center shrink-0">
                      <AlertTriangle size={24} />
                   </div>
                   <div className="space-y-2">
                      <h3 className="text-xl font-black text-navy">{r.risk}</h3>
                      <p className="text-sm text-gray-600"><span className="font-bold text-red-600">KANIT:</span> {r.evidence}</p>
                      <p className="text-sm text-gray-600"><span className="font-bold text-navy">OLASI SONUÇ:</span> {r.if_ignored}</p>
                      <div className="flex items-center gap-2 mt-4">
                         <span className="text-[10px] font-bold text-gray-400">RİSK SKORU:</span>
                         <div className="h-2 w-32 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-red-600" style={{ width: `${r.urgency_score}%` }} />
                         </div>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'success' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4">
              {report.success_stories.map((s: any, i: number) => (
                 <div key={i} className="bg-white p-8 rounded-3xl border-2 border-green-50 space-y-4">
                    <div className="h-12 w-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center">
                       <Trophy size={24} />
                    </div>
                    <h3 className="text-xl font-black text-navy">{s.what_improved}</h3>
                    <div className="flex items-baseline gap-2">
                       <span className="text-3xl font-black text-green-600">+{s.by_how_much}</span>
                       <span className="text-xs font-bold text-gray-400 uppercase">PUAN ARTIŞI</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed"><span className="font-bold text-navy">NEDEN:</span> {s.likely_reason}</p>
                 </div>
              ))}
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              {report.action_plan.map((a: any, i: number) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
                   <div className="flex gap-6 items-center">
                      <div className="h-14 w-14 bg-navy text-white rounded-2xl flex items-center justify-center text-xl font-black shrink-0">
                         {a.priority}
                      </div>
                      <div className="space-y-1">
                         <h3 className="text-lg font-black text-navy">{a.title}</h3>
                         <div className="flex items-center gap-3">
                            <Badge variant="blue">{a.target_dimension}</Badge>
                            <span className="text-xs text-gray-400 font-bold">{a.target_department || 'TÜM ŞİRKET'}</span>
                         </div>
                      </div>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="text-right hidden md:block">
                         <p className="text-[10px] font-bold text-gray-400 uppercase">Tahmini Etki</p>
                         <p className="text-sm font-black text-primary">{a.expected_impact}</p>
                      </div>
                      <Button size="sm" variant="primary" className="gap-2" onClick={() => handleCreateAction(a)}>
                         Aksiyon Oluştur <Plus size={16} />
                      </Button>
                   </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'forecast' && (
            <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4">
               <div className="bg-navy rounded-[40px] p-12 text-white text-center space-y-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/20 to-transparent pointer-events-none" />
                  <p className="text-sm font-black uppercase tracking-[0.3em] text-primary-light">Gelecek Ay Tahmini</p>
                  <div className="flex justify-center items-center gap-12">
                     <div>
                        <p className="text-xs font-bold text-gray-400 mb-2">PESİMİST</p>
                        <p className="text-4xl font-black text-rose-400">{report.forecast.next_month_range.pessimistic}</p>
                     </div>
                     <div className="scale-125">
                        <p className="text-xs font-bold text-primary-light mb-2">GERÇEKÇİ</p>
                        <p className="text-6xl font-black">{report.forecast.next_month_range.realistic}</p>
                     </div>
                     <div>
                        <p className="text-xs font-bold text-gray-400 mb-2">İyimser</p>
                        <p className="text-4xl font-black text-emerald-400">{report.forecast.next_month_range.optimistic}</p>
                     </div>
                  </div>
                  <div className="pt-8 border-t border-white/5">
                     <p className="text-sm text-gray-300 italic">"Kilit Varsayım: {report.forecast.key_assumption}"</p>
                  </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                     <h4 className="font-black text-navy mb-4 uppercase tracking-widest text-xs">Kırılma Noktası</h4>
                     <p className="text-sm text-gray-600 leading-relaxed font-bold">{report.forecast.tipping_point}</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                     <h4 className="font-black text-navy mb-4 uppercase tracking-widest text-xs">Erken Uyarı İşaretleri</h4>
                     <ul className="space-y-2">
                        {report.forecast.early_warning_signs.map((s: any, i: number) => (
                           <li key={i} className="flex items-center gap-2 text-xs font-medium text-gray-500">
                              <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                              {s}
                           </li>
                        ))}
                     </ul>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

function SentimentCard({ label, value, color }: any) {
  const colors: any = {
    green: 'bg-green-50 text-green-600 border-green-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    gray: 'bg-gray-50 text-gray-600 border-gray-100',
  };
  return (
    <div className={`p-4 rounded-2xl border ${colors[color]} text-center`}>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{label}</p>
      <p className="text-2xl font-black">% {value}</p>
    </div>
  );
}
