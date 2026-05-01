'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  ArrowLeft, 
  ClipboardList, 
  Settings, 
  Eye, 
  Save,
  Plus,
  Trash2,
  GripVertical
} from 'lucide-react';
import Link from 'next/link';
import { useApi } from '@/hooks/useApi';
import { useParams } from 'next/navigation';

export default function SurveyDetailPage() {
  const params = useParams();
  const { data: survey, loading } = useApi<any>(`/admin/surveys/${params.id}`);

  if (loading) return <div className="flex justify-center py-20 text-gray-400">Yükleniyor...</div>;
  if (!survey) return <div className="flex justify-center py-20 text-red-500">Anket bulunamadı.</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/surveys">
            <Button variant="ghost" size="sm" className="p-2 border border-gray-100 bg-white">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-navy">{survey.title_tr}</h1>
            <div className="flex items-center gap-2 mt-1">
               <Badge variant={survey.type === 'global' ? 'blue' : 'purple'}>{survey.type?.toUpperCase()}</Badge>
               <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ID: {survey.id}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="ghost" className="flex-1 sm:flex-none border border-gray-100 bg-white">Önizle</Button>
          <Button className="flex-1 sm:flex-none gap-2">
            <Save size={18} />
            Kaydet
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Settings */}
        <div className="lg:col-span-1 space-y-6">
          <Card title="Anket Ayarları">
            <div className="space-y-4">
               <div>
                 <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Başlık (TR)</label>
                 <input defaultValue={survey.title_tr} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm outline-none" />
               </div>
               <div>
                 <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Başlık (EN)</label>
                 <input defaultValue={survey.title_en} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm outline-none" />
               </div>
               <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <span className="text-sm font-bold text-navy">Anket Aktif</span>
                  <div className={`w-10 h-5 rounded-full relative cursor-pointer ${survey.is_active ? 'bg-primary' : 'bg-gray-200'}`}>
                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${survey.is_active ? 'left-6' : 'left-1'}`} />
                  </div>
               </div>
            </div>
          </Card>

          <Card title="Boyutlar & Puanlama">
             <div className="space-y-3">
               {['physical', 'mental', 'social', 'financial', 'work'].map(dim => (
                 <div key={dim} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                   <span className="text-xs font-bold text-navy capitalize">{dim}</span>
                   <Badge variant="blue">{survey.questions?.filter((q: any) => q.dimension === dim).length || 0} Soru</Badge>
                 </div>
               ))}
             </div>
          </Card>
        </div>

        {/* Question Builder */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-lg font-bold text-navy">Sorular ({survey.questions?.length || 0})</h3>
               <Button size="sm" variant="secondary" className="gap-2">
                 <Plus size={16} />
                 Soru Ekle
               </Button>
            </div>
            
            <div className="space-y-4">
              {survey.questions?.sort((a: any, b: any) => a.order - b.order).map((question: any, idx: number) => (
                <div key={question.id} className="p-4 bg-white border border-gray-100 rounded-2xl group hover:border-primary/20 transition-all shadow-sm">
                   <div className="flex gap-3">
                      <div className="mt-1 text-gray-300 cursor-grab">
                        <GripVertical size={18} />
                      </div>
                      <div className="flex-1 space-y-3">
                         <div className="flex justify-between items-start">
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">SORU {idx + 1} • {question.type?.toUpperCase()}</span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button className="p-1.5 text-gray-400 hover:text-navy hover:bg-gray-50 rounded-lg"><Settings size={14} /></button>
                               <button className="p-1.5 text-gray-400 hover:text-danger hover:bg-danger/5 rounded-lg"><Trash2 size={14} /></button>
                            </div>
                         </div>
                         <p className="text-sm font-bold text-navy">{question.text_tr}</p>
                         <div className="flex gap-2">
                            <Badge variant="gray" className="text-[8px]">{question.dimension}</Badge>
                            {question.is_required && <Badge variant="orange" className="text-[8px]">ZORUNLU</Badge>}
                         </div>
                      </div>
                   </div>
                </div>
              ))}
              
              {!survey.questions?.length && (
                <div className="py-12 text-center text-gray-400 italic bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100">
                   Henüz soru eklenmemiş.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
