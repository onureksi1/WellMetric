'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Bot, 
  Send, 
  Sparkles, 
  History, 
  ArrowRight,
  MessageSquare,
  Zap,
  LayoutDashboard,
  TrendingDown,
  FileText,
  Download,
  AlertTriangle,
  RefreshCw,
  Plus,
  Eye
} from 'lucide-react';
import client from '@/lib/api/client';
import { useApi } from '@/hooks/useApi';
import { toast } from 'react-hot-toast';
import { IntelligenceReportModal } from '@/components/ai/IntelligenceReportModal';

export default function HrAiPage() {
  const { t } = useTranslation('dashboard');
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState<{ role: 'user' | 'assistant', text: string }[]>([
    { role: 'assistant', text: t('ai.chat.welcome', 'Merhaba! Şirketinizin esenlik verileriyle ilgili size nasıl yardımcı olabilirim? Departman analizleri yapabilir veya trendleri yorumlayabilirim.') }
  ]);


  const sendMessage = () => {
    if (!message.trim()) return;
    setChat([...chat, { role: 'user', text: message }]);
    setMessage('');
    
    // Simulate AI response
    setTimeout(() => {
      setChat(prev => [...prev, { 
        role: 'assistant', 
        text: t('ai.chat.mock_response', 'Analizime göre Yazılım departmanındaki stres seviyesi son 3 ayda %15 arttı. Bu durum genellikle son teslim tarihlerine yakın dönemlerde pik yapıyor. İlgili ekibe esnek çalışma saatleri veya mindfulness seansları önerebilirim.') 
      }]);
    }, 1000);
  };

  const currentPeriod = new Date().toISOString().slice(0, 7);
  const [selectedPeriod, setSelectedPeriod] = useState(currentPeriod);
  const { data: report, refresh: refreshReport } = useApi<any>(`/hr/ai/intelligence-report/${selectedPeriod}`);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      await client.post('/hr/ai/intelligence-report', { period: selectedPeriod });
      toast.success(t('ai.report.request_success', 'Rapor hazırlanıyor! Yaklaşık 1-2 dakika sürebilir. Tamamlanınca size mail ile haber vereceğiz.'));
      // Poll or wait - for now just refresh after a bit
      setTimeout(refreshReport, 10000);
    } catch (e) {
      toast.error(t('ai.report.request_error', 'Rapor isteği başarısız oldu.'));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 h-[calc(100vh-160px)] flex flex-col">
      <div className="flex justify-between items-center flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-navy">{t('ai.title', 'AI Asistan')}</h1>
          <p className="text-sm text-gray-500">{t('ai.subtitle', 'Şirket verileriniz üzerinde derinlemesine analiz yapan akıllı asistan.')}</p>
        </div>

      {/* Intelligence Report Section */}
      <Card className="bg-white border-2 border-primary/10 overflow-hidden shadow-lg shadow-primary/5">
        {report ? (
          <div className="flex flex-col md:flex-row items-stretch">
            <div className="md:w-1/3 bg-navy p-6 text-white flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                   <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                      <FileText size={20} />
                   </div>
                   <div>
                      <p className="text-sm font-black uppercase tracking-widest text-primary-light">İstihbarat Raporu</p>
                      <p className="text-[10px] text-gray-400 font-bold">{selectedPeriod} Dönemi</p>
                   </div>
                </div>
                <div className="space-y-3">
                   <div className="flex items-center gap-2 text-xs font-bold bg-white/5 p-2 rounded-lg border border-white/5">
                      <AlertTriangle size={14} className="text-rose-400" />
                      {report.metadata?.report?.risk_assessment?.critical_risks?.length || 0} Kritik Risk Tespit Edildi
                   </div>
                   <div className="flex items-center gap-2 text-xs font-bold bg-white/5 p-2 rounded-lg border border-white/5">
                      <Sparkles size={14} className="text-amber-400" />
                      {report.metadata?.report?.success_stories?.length || 0} Başarı Hikayesi
                   </div>
                </div>
              </div>
              <div className="mt-8 flex gap-2">
                <Button size="sm" variant="primary" className="flex-1 gap-2" onClick={() => setIsModalOpen(true)}>
                   <Eye size={16} /> {t('ai.report.view', 'Raporu Oku')}
                </Button>
                <Button size="sm" variant="outline" className="text-white border-white/10 hover:bg-white/5" 
                  onClick={async () => {
                    if (!report.metadata?.pdf_s3_key) return;
                    const { data } = await client.get(`/reports/signed-url`, { params: { key: report.metadata.pdf_s3_key } });
                    window.open(data.url, '_blank');
                  }}
                >
                   <Download size={16} />
                </Button>
              </div>
            </div>
            <div className="flex-1 p-6 flex flex-col justify-between bg-gray-50/30">
               <div>
                  <p className="text-sm text-navy font-bold italic line-clamp-4 leading-relaxed">
                    "{report.metadata?.report?.executive_summary}"
                  </p>
               </div>
               <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Son Güncelleme: {new Date(report.generated_at).toLocaleString('tr-TR')}</p>
                  <button onClick={handleGenerateReport} className="text-[10px] font-black text-primary hover:underline flex items-center gap-1">
                    <RefreshCw size={10} className={isGenerating ? 'animate-spin' : ''} /> {t('ai.report.refresh', 'YENİLE')}
                  </button>
               </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center space-y-4">
             <div className="h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
                <FileText size={32} className="text-gray-300" />
             </div>
             <div>
                <h3 className="text-lg font-bold text-navy">{t('ai.report.none_title', 'Dönemlik İstihbarat Raporu')}</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto">{t('ai.report.none_desc', 'Seçilen dönem için henüz bir yapay zeka istihbarat raporu oluşturulmamış.')}</p>
             </div>
             <div className="flex items-center justify-center gap-4">
                <select 
                  className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm font-bold outline-none"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                >
                   <option value="2026-04">Nisan 2026</option>
                   <option value="2026-03">Mart 2026</option>
                   <option value="2026-02">Şubat 2026</option>
                </select>
                <Button 
                  onClick={handleGenerateReport} 
                  isLoading={isGenerating}
                  className="gap-2"
                >
                   <Sparkles size={18} /> {t('ai.report.generate', 'Rapor Oluştur')}
                </Button>
             </div>
          </div>
        )}
      </Card>

      <IntelligenceReportModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        report={report?.metadata?.report}
        period={selectedPeriod}
      />

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 overflow-hidden">
        {/* Chat Section */}
        <Card className="lg:col-span-2 flex flex-col h-full !p-0 overflow-hidden shadow-xl border-gray-100">
           <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-navy text-white">
              <div className="flex items-center gap-3">
                 <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                    <Bot size={18} />
                 </div>
                 <div>
                    <p className="text-sm font-bold">{t('ai.chat.agent_name', 'İK Veri Asistanı')}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Claude 3.5 Sonnet</p>
                 </div>
              </div>
              <button className="text-[10px] font-bold text-gray-400 hover:text-white border border-white/10 px-2 py-1 rounded transition-all">{t('ai.chat.clear', 'SOHBETİ TEMİZLE')}</button>

           </div>

           {/* Messages */}
           <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
              {chat.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                     msg.role === 'user' 
                     ? 'bg-primary text-white rounded-tr-none shadow-md shadow-primary/10' 
                     : 'bg-white text-navy rounded-tl-none border border-gray-100 shadow-sm'
                   }`}>
                      {msg.text}
                   </div>
                </div>
              ))}
           </div>

           {/* Suggestions */}
           <div className="px-6 py-3 flex gap-2 overflow-x-auto whitespace-nowrap bg-white border-t border-gray-50 no-scrollbar">
              <QuickAction label={t('ai.chat.examples.why_score_dropped', 'Bu ay neden skor düştü?')} />
              <QuickAction label={t('ai.chat.examples.risky_dept', 'En riskli departman hangisi?')} />
              <QuickAction label={t('ai.chat.examples.wellbeing_trend', 'Esenlik trendimiz nasıl?')} />
           </div>


           {/* Input */}
           <div className="p-4 bg-white border-t border-gray-100">
              <div className="relative flex items-center">
                 <input 
                   type="text" 
                   value={message}
                   onChange={(e) => setMessage(e.target.value)}
                   onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                   placeholder={t('ai.chat.placeholder', 'Asistan ile konuşun...')}
                   className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-12 py-3.5 text-sm focus:ring-2 focus:ring-primary/10 outline-none transition-all font-medium"
                 />
                 <button 
                    onClick={sendMessage}
                    className="absolute right-2 h-10 w-10 bg-primary text-white rounded-lg flex items-center justify-center hover:bg-primary-dark transition-all shadow-md shadow-primary/20"
                 >
                    <Send size={18} />
                 </button>
              </div>
           </div>
        </Card>

        {/* Insight Archive */}
        <div className="space-y-6 overflow-y-auto pr-2">
           <h3 className="text-sm font-black text-navy uppercase tracking-widest flex items-center gap-2">
              <History size={16} className="text-gray-400" />
              {t('ai.insights.recent_title', 'Son Analizler')}
           </h3>
           
           <InsightCard 
             type={t('ai.insights.types.risk_alert', 'Risk Uyarısı')} 
             date="16 Nis 2026" 
             text={t('ai.insights.mock.risk_text', 'Yazılım departmanı stres seviyesi kritik seviyeye ulaştı.')}
             level="danger"
           />

           
           <InsightCard 
             type={t('ai.insights.types.trend_analysis', 'Trend Analizi')} 
             date="15 Nis 2026" 
             text={t('ai.insights.mock.trend_text', 'Sosyal etkileşim skorları şirket genelinde %12 artış gösterdi.')}
             level="success"
           />


           <Card className="bg-gray-50 border-dashed border-2 border-gray-200 flex flex-col items-center justify-center py-8 opacity-60">
              <Sparkles size={24} className="text-gray-300 mb-2" />
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                 {t('ai.insights.empty_hint', 'Daha fazla analiz için yeni bir anket tamamlanmalı')}
              </p>
           </Card>

        </div>
      </div>
    </div>
  );
}

function QuickAction({ label }: { label: string }) {
  return (
    <button className="text-[10px] font-black text-gray-400 hover:text-primary hover:bg-primary/5 border border-gray-100 hover:border-primary/20 px-3 py-1.5 rounded-full transition-all uppercase tracking-tighter">
      {label}
    </button>
  );
}

function InsightCard({ type, date, text, level }: any) {
  return (
    <Card className="hover:border-primary/20 transition-all cursor-pointer group">
       <div className="flex justify-between items-start mb-2">
          <Badge variant={level === 'danger' ? 'red' : 'green'} size="sm">{type.toUpperCase()}</Badge>
          <span className="text-[10px] font-bold text-gray-400">{date}</span>
       </div>
       <p className="text-xs font-bold text-navy line-clamp-2 leading-relaxed mb-4">{text}</p>
       <div className="flex justify-end">
          <ArrowRight size={14} className="text-gray-300 group-hover:text-primary transition-all" />
       </div>
    </Card>
  );
}
