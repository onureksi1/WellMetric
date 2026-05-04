'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Library, 
  ClipboardList, 
  BrainCircuit, 
  Building2, 
  User as UserIcon,
  Calendar,
  Layers,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'react-hot-toast';
import client from '@/lib/api/client';

export default function SurveyPoolDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [survey, setSurvey] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSurvey();
  }, [params.id]);

  const fetchSurvey = async () => {
    try {
      const res = await client.get(`/admin/survey-pool/${params.id}`);
      setSurvey(res.data);
    } catch (error) {
      toast.error('Anket detayı yüklenemedi.');
      router.push('/admin/survey-pool');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-slate-500 font-medium italic">Anket detayları çözümleniyor...</p>
      </div>
    );
  }

  if (!survey) return null;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/admin/survey-pool')}
            className="w-12 h-12 rounded-full border border-slate-200 bg-white hover:bg-slate-50"
          >
            <ArrowLeft size={24} />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-navy">{survey.title_tr}</h1>
              <Badge variant="blue" className="bg-primary/10 text-primary border-none text-[10px] uppercase font-black">HAVUZ KAYDI</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-slate-500 font-medium">
              <span className="flex items-center gap-1.5"><UserIcon size={14} className="text-primary" /> {survey.created_by_user?.full_name}</span>
              <span className="flex items-center gap-1.5"><Building2 size={14} className="text-primary" /> {survey.company?.industry || 'Genel'}</span>
              <span className="flex items-center gap-1.5"><Calendar size={14} className="text-primary" /> {new Date(survey.pool_added_at).toLocaleDateString('tr-TR')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Meta */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6 border-none shadow-sm space-y-6">
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Anket Yapısı</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <span className="text-sm font-bold text-navy">Toplam Soru</span>
                  <Badge className="bg-navy text-white border-none">{survey.questions?.length || 0}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <span className="text-sm font-bold text-navy">Anket Tipi</span>
                  <span className="text-xs font-black text-primary uppercase">{survey.type}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <span className="text-sm font-bold text-navy">Frekans</span>
                  <span className="text-xs font-bold text-slate-500 capitalize">{survey.frequency || 'Belirtilmemiş'}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Ölçülen Boyutlar</h3>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(survey.questions?.map((q: any) => q.dimension))).map((dim: any) => (
                  <Badge key={dim} variant="gray" className="px-3 py-1 border-slate-200 text-navy font-bold uppercase text-[10px]">
                    {dim}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
              <p className="text-[11px] text-amber-700 leading-relaxed font-medium italic">
                Bu anket salt okunur moddadır. Consultant tarafından paylaşılan orijinal yapıyı gösterir. Düzenleme veya silme yapılamaz.
              </p>
            </div>
          </Card>
        </div>

        {/* Right Column - Questions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2 px-2">
            <h3 className="text-lg font-black text-navy flex items-center gap-2">
              <ClipboardList className="text-primary" size={20} />
              Soru Listesi
            </h3>
          </div>
          
          <div className="space-y-4">
            {survey.questions?.sort((a: any, b: any) => a.order_index - b.order_index).map((question: any, idx: number) => (
              <div 
                key={question.id}
                className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:border-primary/20 transition-all group"
              >
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 font-black text-sm shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                    {idx + 1}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex justify-between items-start">
                      <Badge variant="gray" className="bg-slate-100 text-slate-500 border-none text-[9px] font-black uppercase tracking-widest px-2 py-0.5">
                        {question.question_type}
                      </Badge>
                      <Badge variant="gray" className="text-[9px] uppercase font-bold border-slate-200 text-slate-400 tracking-tighter">
                        {question.dimension}
                      </Badge>
                    </div>
                    <p className="text-navy font-bold leading-relaxed">{question.question_text_tr}</p>
                    {question.question_text_en && (
                      <p className="text-slate-400 text-sm italic font-medium">{question.question_text_en}</p>
                    )}

                    {/* Options Preview */}
                    {['single_choice', 'multi_choice', 'ranking'].includes(question.question_type) && question.options?.length > 0 && (
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {question.options.map((opt: any) => (
                          <div key={opt.id} className="text-xs p-2 bg-slate-50 rounded-lg border border-slate-100 text-slate-600 font-medium">
                            {opt.label_tr}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Matrix Preview */}
                    {question.question_type === 'matrix' && question.rows?.length > 0 && (
                      <div className="mt-4 space-y-1.5">
                        {question.rows.map((row: any) => (
                          <div key={row.id} className="flex justify-between items-center text-xs p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-slate-600 font-medium">
                            <span>{row.label_tr}</span>
                            <Badge className="bg-white text-slate-400 border-slate-200 text-[8px]">{row.dimension}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
