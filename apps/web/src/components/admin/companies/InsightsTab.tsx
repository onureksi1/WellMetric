'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import client from '@/lib/api/client';
import { Bot, Calendar, ChevronRight, AlertTriangle, TrendingUp, Lightbulb } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'react-hot-toast';

interface InsightsTabProps {
  companyId: string;
}

export const InsightsTab: React.FC<InsightsTabProps> = ({ companyId }) => {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInsight, setSelectedInsight] = useState<any>(null);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const res = await client.get(`/admin/ai/insights?company_id=${companyId}`);
      setInsights(res.data.items || []);
    } catch (err) {
      toast.error('AI analizleri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [companyId]);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'risk_alert': return <AlertTriangle className="text-danger" size={20} />;
      case 'trend_analysis': return <TrendingUp className="text-primary" size={20} />;
      default: return <Lightbulb className="text-warning" size={20} />;
    }
  };

  const getInsightLabel = (type: string) => {
    switch (type) {
      case 'risk_alert': return 'Risk Uyarısı';
      case 'trend_analysis': return 'Trend Analizi';
      case 'open_text_summary': return 'Yorum Özeti';
      default: return 'AI İçgörü';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-navy">AI Insights</h3>
        <Badge variant="blue" className="gap-1.5 py-1 px-3">
          <Bot size={14} /> AI DESTEKLİ
        </Badge>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-50 animate-pulse rounded-2xl" />)}
        </div>
      ) : insights.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
           <Bot className="mx-auto text-gray-300 mb-4" size={48} />
           <p className="text-gray-500 font-medium">Bu firma için henüz AI analizi oluşturulmadı.</p>
           <p className="text-gray-400 text-sm mt-1">Anketler tamamlandıktan sonra otomatik analizler burada görünecektir.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {insights.map((insight) => (
            <Card 
              key={insight.id} 
              className="p-5 hover:border-primary/30 transition-all cursor-pointer group"
              onClick={() => setSelectedInsight(insight)}
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0">
                    {getInsightIcon(insight.insight_type)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                       <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{getInsightLabel(insight.insight_type)}</span>
                       <span className="h-1 w-1 rounded-full bg-gray-300" />
                       <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar size={12} /> {new Date(insight.generated_at).toLocaleDateString('tr-TR')}
                       </span>
                    </div>
                    <p className="text-navy font-semibold line-clamp-2 leading-snug">
                      {insight.content}
                    </p>
                  </div>
                </div>
                <ChevronRight className="text-gray-300 group-hover:text-primary transition-colors" size={20} />
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!selectedInsight}
        onClose={() => setSelectedInsight(null)}
        title={selectedInsight ? getInsightLabel(selectedInsight.insight_type) : ''}
      >
        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-2xl">
             <p className="text-navy leading-relaxed whitespace-pre-wrap">
                {selectedInsight?.content}
             </p>
          </div>
          
          {selectedInsight?.metadata && (
            <div className="grid grid-cols-2 gap-4">
               <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Dönem</p>
                  <p className="text-sm font-bold text-navy">{selectedInsight.period}</p>
               </div>
               <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Analiz Modeli</p>
                  <p className="text-sm font-bold text-navy uppercase">{selectedInsight.metadata.model || 'Claude 3.5'}</p>
               </div>
            </div>
          )}

          <div className="flex justify-end">
             <Button onClick={() => setSelectedInsight(null)}>Kapat</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
