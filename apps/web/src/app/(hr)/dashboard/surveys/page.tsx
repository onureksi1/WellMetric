'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  ClipboardList, 
  BarChart2, 
  Eye, 
  Plus, 
  Calendar,
  Send,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import Link from 'next/link';
import { CampaignWizardModal } from '@/components/campaign/CampaignWizardModal';
import client from '@/lib/api/client';

export default function HrSurveysPage() {
  const { t } = useTranslation(['dashboard', 'common']);
  const queryClient = useQueryClient();
  const { data: surveys, isLoading: loading } = useQuery({
    queryKey: ['hr-surveys'],
    queryFn: async () => {
      const { data } = await client.get('/hr/surveys');
      return data;
    }
  });
  const [wizardData, setWizardData] = useState<any>(null);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-navy">{t('surveys.title')}</h1>
          <p className="text-sm text-gray-500">{t('surveys.subtitle')}</p>
        </div>
        <div />
      </div>


      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="animate-pulse h-48 bg-gray-50" />
          <Card className="animate-pulse h-48 bg-gray-50" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {surveys?.filter(s => s.status === 'active').map((survey) => (
              <Card key={survey.id} className="border-l-4 border-l-primary relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <Badge variant={survey.type === 'global' ? 'blue' : 'purple'} className="mb-2 uppercase text-[8px] sm:text-xs">
                        {survey.type === 'global' ? t('common:global_survey') : t('common:company_specific')}
                      </Badge>

                      <h3 className="text-lg md:text-xl font-bold text-navy">{survey.title}</h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-gray-400 font-bold mt-2">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} className="text-primary" />
                          {t('common:period')}: {survey.period}
                        </div>
                        {survey.due_at && (
                          <div className="flex items-center gap-1">
                            <Calendar size={14} className="text-danger" />
                            {t('common:due_date')}: {new Date(survey.due_at).toLocaleDateString(t('common:date_locale'))}
                          </div>
                        )}

                      </div>
                    </div>
                    <div className="h-10 w-10 sm:h-12 sm:w-12 bg-primary/5 text-primary rounded-xl flex items-center justify-center shrink-0">
                      <ClipboardList size={24} />
                    </div>
                  </div>

                  {survey.campaign_count === 0 && (
                    <div className="p-3 bg-warning/5 rounded-lg border border-warning/10 mb-4 flex gap-2 items-center text-warning text-[10px] sm:text-xs font-bold uppercase tracking-widest">
                      <AlertCircle size={16} />
                      {t('surveys.no_distribution')}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('surveys.participation_status')}</p>
                      <p className="text-xs sm:text-sm font-black text-navy uppercase tracking-widest">{survey.campaign_count > 0 ? t('surveys.distributed') : t('common:waiting')}</p>
                    </div>
                    <div className="w-full h-2.5 sm:h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${survey.campaign_count > 0 ? 'bg-primary shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-gray-200'}`} 
                        style={{ width: survey.campaign_count > 0 ? '100%' : '0%' }} 
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-2">
                  <Link href={`/dashboard/surveys/${survey.survey_id}/results`} className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full gap-2 font-bold py-2.5">
                      <BarChart2 size={16} />
                      {t('surveys.view_results')}
                    </Button>
                  </Link>
                  {survey.status === 'active' && survey.campaign_count === 0 && (
                    <Button 
                      variant="primary" 
                      size="sm" 
                      className="flex-1 gap-2 font-bold py-2.5 shadow-lg shadow-primary/20"
                      onClick={() => setWizardData({
                        survey_id: survey.survey_id,
                        assignment_id: survey.id,
                        period: survey.period
                      })}
                    >
                      <Send size={16} />
                      {t('surveys.start_distribution')}
                    </Button>
                  )}
                  {survey.campaign_count > 0 && (
                    <Link href={`/dashboard/campaigns?survey_id=${survey.survey_id}`} className="flex-1 sm:flex-none sm:w-auto">
                      <Button variant="ghost" size="sm" className="w-full gap-2 border border-gray-100 text-[10px] font-bold py-2.5">
                        <Eye size={14} />
                        {t('surveys.campaign_details')}
                      </Button>
                    </Link>
                  )}
                </div>
              </Card>
            ))}

            {surveys?.filter(s => s.status === 'active').length === 0 && (
              <Card className="border-l-4 border-l-warning flex items-center justify-center bg-gray-50/50 border-dashed lg:col-span-2 py-12">
                <div className="text-center">
                  <div className="h-14 w-14 bg-gray-100 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus size={28} />
                  </div>
                  <p className="text-sm font-black text-gray-400 uppercase tracking-widest">{t('surveys.no_active_survey')}</p>
                </div>
              </Card>
            )}
          </div>

          {/* Completed Surveys */}
          <Card title={t('surveys.past_surveys')}>

            <div className="p-0 overflow-x-auto">
              {/* Desktop Table */}
              <table className="hidden md:table w-full text-left text-sm">
                <thead className="bg-gray-50/50 text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                  <tr>
                    <th className="py-4 px-4">{t('surveys.survey_title')}</th>
                    <th className="py-4 px-4 text-center">{t('common:period')}</th>
                    <th className="py-4 px-4 text-center">{t('common:status')}</th>
                    <th className="py-4 px-4 text-right">{t('common:actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {surveys?.filter(s => s.status !== 'active').map((survey) => (
                    <tr key={survey.id} className="hover:bg-gray-50/30 transition-colors group">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                           <div className={clsx('h-8 w-8 rounded-lg flex items-center justify-center shadow-sm', survey.type === 'global' ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500')}>
                              <ClipboardList size={16} />
                           </div>
                           <div>
                             <p className="font-bold text-navy group-hover:text-primary transition-colors">{survey.title}</p>
                             <Badge variant={survey.type === 'global' ? 'blue' : 'purple'} className="text-[8px] px-1 py-0 uppercase">
                                {survey.type === 'global' ? t('common:global') : t('common:special')}
                             </Badge>
                           </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-gray-500">{survey.period}</td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest border border-gray-100 px-2 py-0.5 rounded-full">{survey.status}</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Button variant="ghost" size="sm" className="text-primary font-black hover:bg-primary/5 uppercase tracking-widest text-[10px]">{t('surveys.view_results')}</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-100">
                {surveys?.filter(s => s.status !== 'active').map((survey) => (
                  <div key={survey.id} className="p-4 space-y-3 active:bg-gray-50 transition-colors">
                     <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                           <div className={clsx('h-8 w-8 rounded-lg flex items-center justify-center', survey.type === 'global' ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500')}>
                              <ClipboardList size={16} />
                           </div>
                           <div>
                             <p className="font-bold text-navy">{survey.title}</p>
                             <Badge variant={survey.type === 'global' ? 'blue' : 'purple'} className="text-[8px] px-1 py-0 uppercase">
                                {survey.type === 'global' ? t('common:global') : t('common:special')}
                             </Badge>
                           </div>
                        </div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{survey.status}</span>
                     </div>
                     <div className="flex justify-between items-center pt-2">
                        <p className="text-[10px] font-bold text-gray-500 uppercase">{t('common:period')}: {survey.period}</p>
                        <Button variant="ghost" size="sm" className="text-primary font-black h-8 px-2 uppercase tracking-widest text-[9px] bg-primary/5 rounded-lg">
                          {t('surveys.view_results')}
                        </Button>
                     </div>
                  </div>
                ))}
              </div>

              {surveys?.filter(s => s.status !== 'active').length === 0 && (
                <div className="py-12 text-center text-gray-400 italic text-sm">{t('surveys.no_past_surveys')}</div>
              )}
            </div>
          </Card>
        </>
      )}

      <CampaignWizardModal
        isOpen={!!wizardData}
        onClose={() => setWizardData(null)}
        initialData={wizardData}
        onSuccess={() => {
          setWizardData(null);
          queryClient.invalidateQueries({ queryKey: ['hr-surveys'] });
        }}
      />
    </div>
  );
}
