'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Plus, 
  Search, 
  ClipboardList,
  Eye, 
  BarChart2, 
  Trash2,
  Calendar,
  Share2
} from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useApi } from '@/hooks/useApi';
import { AssignSurveyModal } from '@/components/surveys/AssignSurveyModal';

const getQuestionTypes = (t: any) => [
  { value: 'likert5', label: t('surveys.question.types.likert5', '📊 Likert 5 (1-5 Emoji Skala)') },
  { value: 'likert10', label: t('surveys.question.types.likert10', '📊 Likert 10 (1-10 Sayısal)') },
  { value: 'star_rating', label: t('surveys.question.types.star_rating', '⭐ Yıldız Derecelendirme (1-5)') },
  { value: 'yes_no', label: t('surveys.question.types.yes_no', '✅ Evet / Hayır') },
  { value: 'nps', label: t('surveys.question.types.nps', '📈 NPS (0-10)') },
  { value: 'number_input', label: t('surveys.question.types.number_input', '🔢 Sayısal Giriş') },
  { value: 'single_choice', label: t('surveys.question.types.single_choice', '🔘 Tek Seçim (Radio)') },
  { value: 'multi_choice', label: t('surveys.question.types.multi_choice', '☑️ Çoklu Seçim (Checkbox)') },
  { value: 'ranking', label: t('surveys.question.types.ranking', '🔀 Sıralama (Ranking)') },
  { value: 'matrix', label: t('surveys.question.types.matrix', '📋 Tablo (Matrix)') },
  { value: 'open_text', label: t('surveys.question.types.open_text', '📝 Açık Metin') },
];

const getDimensions = (t: any) => [
  { value: 'overall', label: t('common.dimensions.overall', 'Genel (Overall)') },
  { value: 'physical', label: t('common.dimensions.physical', 'Fiziksel (Physical)') },
  { value: 'mental', label: t('common.dimensions.mental', 'Zihinsel (Mental)') },
  { value: 'social', label: t('common.dimensions.social', 'Sosyal (Social)') },
  { value: 'financial', label: t('common.dimensions.financial', 'Finansal (Financial)') },
  { value: 'work', label: t('common.dimensions.work', 'İş (Work)') },
];

export default function SurveysPage() {
  const { t } = useTranslation(['admin', 'common']);
  const { data: surveysData, loading, refresh } = useApi<any>('/admin/surveys');
  const [isAssignModalOpen, setIsAssignModalOpen] = React.useState(false);
  const [selectedSurvey, setSelectedSurvey] = React.useState<{id: string, title: string} | null>(null);

  const handleAssignClick = (id: string, title: string) => {
    setSelectedSurvey({ id, title });
    setIsAssignModalOpen(true);
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-navy">{t('surveys.title', 'Anketler')}</h1>
          <p className="text-sm text-gray-500">{t('surveys.subtitle', 'Global ve kuruma özel anket taslaklarının yönetimi.')}</p>
        </div>
        <Link href="/admin/surveys/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto flex gap-2 shadow-lg shadow-primary/20">
            <Plus size={18} />
            {t('surveys.new', 'Yeni Anket')}
          </Button>
        </Link>
      </div>


      <Card>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={t('surveys.search_placeholder')}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>

          <div className="flex gap-2">
            <select className="flex-1 md:flex-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">{t('surveys.filter_type')}</option>
              <option value="global">{t('surveys.types.global')}</option>
              <option value="company_specific">{t('surveys.types.company_specific')}</option>
              <option value="onboarding">{t('surveys.types.onboarding')}</option>
              <option value="pulse">{t('surveys.types.pulse')}</option>
            </select>
          </div>
        </div>

        <div className="p-0 overflow-x-auto">
          {/* Desktop Table */}
          <table className="hidden md:table w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-black uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-4 px-4">{t('surveys.columns.title')}</th>
                <th className="py-4 px-4 text-center">{t('surveys.columns.questions')}</th>
                <th className="py-4 px-4">{t('surveys.columns.companies')}</th>
                <th className="py-4 px-4">{t('surveys.columns.status')}</th>
                <th className="py-4 px-4 text-right">{t('surveys.columns.actions')}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400 italic">{t('common:loading')}</td></tr>
              ) : surveysData?.data?.map((survey: any) => (
                <tr key={survey.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shadow-sm ${
                          survey.type === 'global' ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500'
                        }`}>
                          <ClipboardList size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-navy group-hover:text-primary transition-colors">{survey.title_tr}</p>
                          <div className="flex items-center gap-2">
                             <Badge variant={survey.type === 'global' ? 'blue' : 'purple'} className="text-[8px] px-1 py-0 uppercase">
                                {survey.type === 'global' ? t('surveys.types.global_caps') : t('surveys.types.company_specific_caps')}
                             </Badge>
                             <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{survey.frequency || t('surveys.frequency_single')}</span>
                          </div>
                        </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center font-black text-navy">{survey.question_count}</td>
                  <td className="py-4 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {survey.type === 'global' ? t('surveys.platform_wide') : `${survey.assigned_company_count} ${t('surveys.companies_count')}`}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5">
                      <div className={`h-2 w-2 rounded-full ${survey.is_active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-gray-300'}`} />
                      <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{survey.is_active ? t('common:active') : t('common:passive')}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex justify-end gap-1">
                        {survey.type !== 'global' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-all"
                            onClick={() => handleAssignClick(survey.id, survey.title_tr)}
                            title={t('surveys.actions.assign')}
                          >
                            <Share2 size={16} />
                          </Button>
                        )}
                        <Link href={`/admin/surveys/${survey.id}`}>
                          <Button variant="ghost" size="sm" className="p-2 text-gray-400 hover:text-navy hover:bg-navy/5 rounded-lg"><Eye size={16} /></Button>
                        </Link>
                        <Button variant="ghost" size="sm" className="p-2 text-gray-400 hover:text-navy hover:bg-navy/5 rounded-lg"><BarChart2 size={16} /></Button>
                        <Button variant="ghost" size="sm" className="p-2 text-gray-400 hover:text-danger hover:bg-danger/5 rounded-lg"><Trash2 size={16} /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-100">
            {loading ? (
              <div className="py-12 text-center text-gray-400 italic">{t('common:loading')}</div>
            ) : surveysData?.data?.map((survey: any) => (
              <div key={survey.id} className="p-4 space-y-4 active:bg-gray-50 transition-colors" onClick={() => window.location.href=`/admin/surveys/${survey.id}`}>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center shadow-sm ${
                      survey.type === 'global' ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500'
                    }`}>
                      <ClipboardList size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-navy">{survey.title_tr}</p>
                      <Badge variant={survey.type === 'global' ? 'blue' : 'purple'} className="text-[8px] px-1 py-0 uppercase">
                        {survey.type === 'global' ? t('surveys.types.global_caps') : t('surveys.types.company_specific_caps')}
                      </Badge>
                    </div>
                  </div>
                  <Badge variant={survey.is_active ? "green" : "gray"} className="text-[8px] px-1 py-0 uppercase">
                    {survey.is_active ? t('common:active') : t('common:passive')}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                   <div className="space-y-1">
                      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{t('surveys.columns.questions')}</p>
                      <p className="text-sm font-black text-navy">{survey.question_count}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{t('surveys.frequency')}</p>
                      <p className="text-xs font-bold text-gray-600 truncate">{survey.frequency || t('surveys.frequency_single')}</p>
                   </div>
                </div>

                <div className="pt-2 flex justify-between items-center border-t border-gray-50">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {survey.type === 'global' ? t('surveys.platform_wide') : `${survey.assigned_company_count} ${t('surveys.companies_count')}`}
                  </span>
                  <div className="flex gap-2">
                    {survey.type !== 'global' && (
                      <Button size="sm" variant="ghost" className="p-2 h-8 w-8 rounded-lg text-primary bg-primary/5" onClick={(e) => { e.stopPropagation(); handleAssignClick(survey.id, survey.title_tr); }}>
                        <Share2 size={14} />
                      </Button>
                    )}
                    <Link href={`/admin/surveys/${survey.id}`} onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" variant="ghost" className="p-2 h-8 w-8 rounded-lg text-navy bg-navy/5">
                        <Plus size={18} /> {t('surveys.add_first_question')}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {selectedSurvey && (
        <AssignSurveyModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          surveyId={selectedSurvey.id}
          surveyTitle={selectedSurvey.title}
          onSuccess={refresh}
        />
      )}
    </div>
  );
}
