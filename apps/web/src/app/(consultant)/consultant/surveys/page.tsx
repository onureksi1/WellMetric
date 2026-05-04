'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  ClipboardList, 
  Search,
  Loader2,
  Trash2,
  Edit,
  Share2,
  BrainCircuit
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth.store';
import { useApi } from '@/hooks/useApi';
import { ConsultantAssignSurveyModal } from '@/components/surveys/ConsultantAssignSurveyModal';

export default function ConsultantSurveysPage() {
  const { t } = useTranslation('consultant');
  const { user } = useAuthStore();
  const { data: surveysData, loading, refresh } = useApi<any>('/consultant/surveys');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<any>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Bu anketi silmek istediğinize emin misiniz?')) return;
    try {
      await client.delete(`/consultant/surveys/${id}`);
      toast.success('Anket başarıyla silindi.');
      refresh();
    } catch (error: any) {
      if (error.response?.data?.code === 'SURVEY_HAS_ACTIVE_ASSIGNMENT') {
        toast.error('Ankete bağlı aktif atama var, önce atamaları iptal edin');
      } else {
        toast.error('Anket silinirken bir hata oluştu.');
      }
    }
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium italic">Anketler yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Anket Yönetimi</h1>
          <p className="text-slate-500">Kendi anketlerinizi oluşturun veya global anketleri firmalara atayın.</p>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/consultant/surveys/new">
          <Card className="p-8 hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-500 group cursor-pointer bg-gradient-to-br from-white to-purple-50/30 h-full">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-200 group-hover:scale-110 transition-transform shrink-0">
                <Plus size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Yeni Anket Oluştur</h3>
                <p className="text-slate-500 text-sm">Firmanıza özel dimension ve sorularla anket tasarlayın.</p>
              </div>
            </div>
          </Card>
        </Link>

        <Card 
          onClick={() => { setSelectedSurvey(null); setIsAssignModalOpen(true); }}
          className="p-8 hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-500 group cursor-pointer bg-gradient-to-br from-white to-blue-50/30 h-full"
        >
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform shrink-0">
              <Share2 size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Global Anketten Seç ve Ata</h3>
              <p className="text-slate-500 text-sm">Platform anketlerini hızlıca müşterilerinize atayın.</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Survey List */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="text-blue-600" size={20} />
            Anket Listesi
          </h2>
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Anket ara..." 
              className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {surveysData?.length > 0 ? (
            surveysData.map((survey: any) => {
              const isOwned = survey.created_by === user?.id;
              return (
                <div key={survey.id} className="p-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between group gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isOwned ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>
                      <ClipboardList size={24} />
                    </div>
                    <div>
                      <div className="flex items-center flex-wrap gap-2 mb-1">
                        <Link href={`/consultant/surveys/${survey.id}`}>
                          <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors hover:underline cursor-pointer">{survey.title_tr}</h4>
                        </Link>
                        {survey.company_id === null ? (
                          <Badge variant="secondary" className="text-[10px]">Global</Badge>
                        ) : survey.created_by === user?.id ? (
                          <Badge variant="purple" className="text-[10px]">Benim</Badge>
                        ) : (
                          <Badge variant="gray" className="text-[10px]">Firma</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                        <span className="flex items-center gap-1"><BrainCircuit size={14} /> {survey.question_count || survey.questions?.length} Soru</span>
                        <span className="flex items-center gap-1 uppercase tracking-wider">{survey.type}</span>
                      </div>
                      


                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-blue-600 hover:bg-blue-50 font-bold"
                      onClick={() => { setSelectedSurvey(survey); setIsAssignModalOpen(true); }}
                    >
                      <Share2 size={16} className="mr-2" /> Ata
                    </Button>
                    
                    {isOwned && (
                      <>
                        <Link href={`/consultant/surveys/${survey.id}/edit`}>
                          <Button variant="ghost" size="sm" className="text-slate-600 hover:bg-slate-100">
                            <Edit size={16} />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(survey.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-20 text-center space-y-4">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                <ClipboardList size={40} />
              </div>
              <p className="text-slate-400 font-medium italic">Henüz bir anket bulunamadı.</p>
            </div>
          )}
        </div>
      </Card>

      {isAssignModalOpen && (
        <ConsultantAssignSurveyModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          surveyId={selectedSurvey?.id}
          surveyTitle={selectedSurvey?.title_tr}
          onSuccess={refresh}
        />
      )}
    </div>
  );
}
