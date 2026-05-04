'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Search, 
  Filter, 
  Mail, 
  Send, 
  Calendar, 
  Clock, 
  ChevronRight, 
  MoreVertical,
  BarChart3,
  MousePointer2,
  CheckCircle2,
  ArrowRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useSearchParams } from 'next/navigation';

import client from '@/lib/api/client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CampaignWizardModal } from '@/components/campaign/CampaignWizardModal';
import { useAuthStore } from '@/lib/store/auth.store';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';

export default function HrCampaignsPage() {
  const { t } = useTranslation('dashboard');
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    period: '',
    survey_id: searchParams?.get('survey_id') ?? ''
  });

  const { data, isLoading } = useQuery({
    queryKey: ['campaigns', filters],
    queryFn: async () => {
      // Only send non-empty filters to avoid UUID validation errors
      const params: any = {};
      if (filters.status) params.status = filters.status;
      if (filters.period) params.period = filters.period;
      if (filters.survey_id) params.survey_id = filters.survey_id;
      const { data } = await client.get('/hr/campaigns', { params });
      return data;
    }
  });

  const remidMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      await client.post(`/hr/campaigns/${campaignId}/remind`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    }
  });

  const getStatusBadge = (status: string, scheduledAt?: string) => {
    switch (status) {
      case 'pending': return <Badge variant="gray">{t('common.waiting', 'Bekliyor')}</Badge>;
      case 'scheduled': return (
        <Badge variant="blue">
          <Clock size={12} className="mr-1" /> 
          {t('campaigns.scheduled', 'Zamanlandı')}: {scheduledAt ? format(new Date(scheduledAt), 'dd MMM HH:mm', { locale: t('common.date_locale', 'tr') === 'tr' ? tr : undefined }) : '-'}
        </Badge>
      );
      case 'sending': return (
        <Badge variant="yellow">
          <Loader2 size={12} className="mr-1 animate-spin" /> 
          {t('campaigns.sending', 'Gönderiliyor')}
        </Badge>
      );
      case 'sent': return <Badge variant="green">{t('campaigns.sent', 'Gönderildi')}</Badge>;
      case 'cancelled': return <Badge variant="red">{t('campaigns.cancelled', 'İptal Edildi')}</Badge>;
      default: return <Badge variant="gray">{status}</Badge>;
    }

  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-navy">{t('campaigns.title')}</h1>
          <p className="text-gray-500">{t('campaigns.subtitle')}</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus size={20} /> {t('campaigns.new_distribution', 'Yeni Dağıtım')}
        </Button>

      </div>

      {/* Filters */}
      <Card className="p-4 flex gap-4 items-center bg-gray-50/50">
        <div className="flex-1 flex gap-2">
           <select 
             className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold text-navy focus:ring-2 focus:ring-primary outline-none"
             value={filters.period}
             onChange={(e) => setFilters({ ...filters, period: e.target.value })}
           >
             <option value="">{t('common.all_periods', 'Tüm Dönemler')}</option>
             <option value="2026-04">{t('common.months.april', 'Nisan')} 2026</option>
             <option value="2026-03">{t('common.months.march', 'Mart')} 2026</option>
           </select>
           <select 
             className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold text-navy focus:ring-2 focus:ring-primary outline-none"
             value={filters.status}
             onChange={(e) => setFilters({ ...filters, status: e.target.value })}
           >
             <option value="">{t('common.all_statuses', 'Tüm Durumlar')}</option>
             <option value="sent">{t('campaigns.sent', 'Gönderildi')}</option>
             <option value="scheduled">{t('campaigns.scheduled', 'Zamanlandı')}</option>
             <option value="pending">{t('common.waiting', 'Bekliyor')}</option>

           </select>
        </div>
        <div className="flex items-center gap-2 px-4 border-l border-gray-200 text-gray-400">
           <Filter size={18} />
           <span className="text-xs font-bold uppercase tracking-widest">{t('common.filter', 'Filtrele')}</span>
        </div>

      </Card>

      {/* Campaign List */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={40} className="text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.items.map((campaign: any) => (
            <Card key={campaign.id} className="p-6 space-y-6 hover:shadow-xl transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-primary" />
                    <h3 className="font-black text-navy truncate max-w-[200px]">
                      {campaign.survey?.title_tr || t('common.general_survey', 'Genel Anket')}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter">
                    {format(new Date(campaign.created_at), 'dd MMMM yyyy', { locale: t('common.date_locale', 'tr') === 'tr' ? tr : undefined })} • {campaign.trigger_type}
                  </p>

                </div>
                {getStatusBadge(campaign.status, campaign.scheduled_at)}
              </div>

              <div className="grid grid-cols-4 gap-2">
                <StatBox label={t('campaigns.sent_short', 'Gönder.')} value={campaign.sent_count} />
                <StatBox label={t('campaigns.open_rate', 'Açılma')} value={`%${campaign.open_rate}`} />
                <StatBox label={t('campaigns.click_rate', 'Tıklama')} value={`%${campaign.click_rate}`} />
                <StatBox label={t('campaigns.completion_short', 'Tamam.')} value={`%${campaign.completion_rate}`} />
              </div>


              <div className="flex gap-2 pt-2">
                <Link href={`/dashboard/campaigns/${campaign.id}`} className="flex-1">
                  <Button variant="secondary" className="w-full text-xs py-2">{t('common.view_details', 'Detay Gör')}</Button>
                </Link>

                {campaign.status === 'sent' && (
                  <Button 
                    variant="outline" 
                    className="flex-1 text-xs py-2"
                    onClick={() => {
                       if (confirm(t('campaigns.remind_confirm', 'Anketi tamamlamayanlara hatırlatma gönderilsin mi?'))) {
                         remidMutation.mutate(campaign.id);
                       }
                    }}
                  >
                    {t('campaigns.remind', 'Hatırlat')}
                  </Button>

                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {data?.items.length === 0 && !isLoading && (
        <div className="text-center py-20 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
           <Mail size={48} className="mx-auto text-gray-300 mb-4" />
           <h3 className="text-xl font-bold text-navy">{t('campaigns.no_campaigns', 'Henüz kampanya yok')}</h3>
           <p className="text-gray-500 max-w-xs mx-auto mt-2">{t('campaigns.no_campaigns_desc', 'Anketlerinizi çalışanlarınıza ulaştırmak için yeni bir dağıtım başlatın.')}</p>
           <Button onClick={() => setIsModalOpen(true)} className="mt-6 gap-2">
             <Plus size={20} /> {t('campaigns.create_first', 'İlk Dağıtımı Oluştur')}
           </Button>
        </div>
      )}


      <CampaignWizardModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
          setIsModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ['campaigns'] });
        }}
      />
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-gray-50 p-2 rounded-xl text-center space-y-0.5">
      <div className="text-sm font-black text-navy">{value}</div>
      <div className="text-[10px] font-bold text-gray-400 uppercase leading-none">{label}</div>
    </div>
  );
}
