'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Mail, 
  MousePointer2, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Filter,
  Download,
  Send,
  Loader2,
  TrendingUp,
  PieChart as PieChartIcon
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import toast from 'react-hot-toast';

import client from '@/lib/api/client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';

const getStatusColors = (t: any): Record<string, string> => ({
  [t('campaigns.detail.filter_completed', 'Tamamladı')]: '#2E865A',
  [t('campaigns.detail.columns.clicked', 'Tıkladı')]: '#3498DB',
  [t('campaigns.detail.columns.opened', 'Açıldı')]: '#F1C40F',
  [t('campaigns.detail.metrics.sent', 'Gönderildi')]: '#BDC3C7',
  [t('campaigns.detail.filter_bounced', 'Bounce')]: '#E74C3C',
});


export default function CampaignDetailPage() {
  const { t } = useTranslation('dashboard');
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [logFilter, setLogFilter] = useState({ status: '', completed: '' });

  const { data: campaign, isLoading: isLoadingCampaign } = useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      const { data } = await client.get(`/hr/campaigns/${id}`);
      return data;
    }
  });

  const { data: logsData, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['campaign-logs', id, logFilter],
    queryFn: async () => {
      const { data } = await client.get(`/hr/campaigns/${id}/logs`, { params: logFilter });
      return data;
    }
  });

  const remindMutation = useMutation({
    mutationFn: async () => {
      await client.post(`/hr/campaigns/${id}/remind`);
    },
    onSuccess: () => {
      toast.success(t('campaigns.detail.actions.remind_success', 'Hatırlatma kampanyası oluşturuldu.'));
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
    }
  });

  const statusColors = getStatusColors(t);


  // Build real trend data from actual log timestamps
  const trendData = React.useMemo(() => {
    const logs: any[] = logsData?.items ?? [];
    if (!logs.length) return [];

    // Collect all relevant timestamps
    const events: { hour: string; type: 'opened' | 'clicked' | 'completed' }[] = [];
    logs.forEach(log => {
      if (log.opened_at) events.push({ hour: new Date(log.opened_at).getHours() + ':00', type: 'opened' });
      if (log.clicked_at) events.push({ hour: new Date(log.clicked_at).getHours() + ':00', type: 'clicked' });
      if (log.completed_at) events.push({ hour: new Date(log.completed_at).getHours() + ':00', type: 'completed' });
    });

    if (!events.length) return [];

    // Group cumulative counts by hour
    const hours = Array.from(new Set(events.map(e => e.hour))).sort();
    let cumOpened = 0, cumClicked = 0, cumCompleted = 0;
    return hours.map(h => {
      cumOpened   += events.filter(e => e.hour === h && e.type === 'opened').length;
      cumClicked  += events.filter(e => e.hour === h && e.type === 'clicked').length;
      cumCompleted += events.filter(e => e.hour === h && e.type === 'completed').length;
      return { time: h, opened: cumOpened, clicked: cumClicked, completed: cumCompleted };
    });
  }, [logsData]);

  if (isLoadingCampaign || !campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  const pieData = [
    { name: t('campaigns.detail.filter_completed', 'Tamamladı'), value: campaign.completed_count },
    { name: t('campaigns.detail.columns.clicked', 'Tıkladı'), value: campaign.clicked_count - campaign.completed_count },
    { name: t('campaigns.detail.columns.opened', 'Açıldı'), value: campaign.opened_count - campaign.clicked_count },
    { name: t('campaigns.detail.metrics.sent', 'Gönderildi'), value: campaign.sent_count - campaign.opened_count },
  ].filter(d => d.value > 0);


  return (
    <div className="p-6 space-y-8">
      {/* Breadcrumb & Actions */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/campaigns">
            <Button variant="ghost" size="sm" className="p-2"><ArrowLeft size={20} /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-black text-navy">{campaign.survey?.title_tr}</h1>
            <p className="text-gray-500 text-sm">
              {t('common.date_format', { 
                val: new Date(campaign.created_at), 
                format: 'dd MMMM yyyy HH:mm',
                defaultValue: format(new Date(campaign.created_at), 'dd MMMM yyyy HH:mm', { locale: tr }) + ' tarihinde başlatıldı'
              })}
            </p>
          </div>

        </div>
        <div className="flex gap-2">
          {campaign.status === 'sent' && (
             <Button variant="outline" className="gap-2" onClick={() => remindMutation.mutate()}>
               <Send size={18} /> {t('campaigns.detail.actions.remind', 'Hatırlatma Gönder')}
             </Button>
          )}
          <Button variant="secondary" className="gap-2">
            <Download size={18} /> {t('campaigns.detail.actions.download_report', 'Rapor İndir')}
          </Button>

        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard label={t('campaigns.detail.metrics.sent', 'Gönderilen')} value={campaign.sent_count} subValue={t('campaigns.detail.metrics.sent_sub', 'Kişi')} icon={<Mail className="text-blue-500" />} />
        <MetricCard label={t('campaigns.detail.metrics.open_rate', 'Açılma Oranı')} value={`%${campaign.open_rate || 0}`} subValue={t('campaigns.detail.metrics.open_sub', '{{count}} kişi açtı', { count: campaign.opened_count })} icon={<TrendingUp className="text-yellow-500" />} />
        <MetricCard label={t('campaigns.detail.metrics.click_rate', 'Tıklama Oranı')} value={`%${campaign.click_rate || 0}`} subValue={t('campaigns.detail.metrics.click_sub', '{{count}} kişi tıkladı', { count: campaign.clicked_count })} icon={<MousePointer2 className="text-primary" />} />
        <MetricCard label={t('campaigns.detail.metrics.completion_rate', 'Tamamlama Oranı')} value={`%${campaign.completion_rate || 0}`} subValue={t('campaigns.detail.metrics.completion_sub', '{{count}} kişi bitirdi', { count: campaign.completed_count })} icon={<CheckCircle2 className="text-green-500" />} />
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <Card className="lg:col-span-2 p-6 space-y-6">
           <div className="flex justify-between items-center">
              <h3 className="font-black text-navy flex items-center gap-2">
                <TrendingUp size={20} className="text-primary" /> {t('campaigns.detail.trend_title', 'Etkileşim Trendi')}
              </h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[#3498DB]" /><span className="text-[10px] font-bold text-gray-400">{t('campaigns.detail.trend_opened', 'AÇILMA')}</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[#2E865A]" /><span className="text-[10px] font-bold text-gray-400">{t('campaigns.detail.trend_completed', 'TAMAMLANMA')}</span></div>
              </div>
           </div>

           <div className="h-[300px]">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorOpened" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3498DB" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3498DB" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2E865A" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#2E865A" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#999' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#999' }} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="opened" stroke="#3498DB" strokeWidth={3} fillOpacity={1} fill="url(#colorOpened)" />
                    <Area type="monotone" dataKey="completed" stroke="#2E865A" strokeWidth={3} fillOpacity={1} fill="url(#colorComp)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-3">
                  <TrendingUp size={40} />
                  <p className="text-sm font-bold text-gray-400">Henüz etkileşim verisi yok</p>
                  <p className="text-xs text-gray-300">E-posta açıldıkça trend burada görünecek</p>
                </div>
              )}
           </div>
        </Card>

        {/* Distribution Chart */}
        <Card className="p-6 space-y-6">
           <h3 className="font-black text-navy flex items-center gap-2">
             <PieChartIcon size={20} className="text-primary" /> {t('campaigns.detail.distribution_title', 'Durum Dağılımı')}
           </h3>
           <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={statusColors[entry.name]} />
                    ))}
                  </Pie>
                  <Legend 
                    verticalAlign="bottom" 
                    iconType="circle"
                    formatter={(val) => <span className="text-[10px] font-bold text-gray-500 uppercase">{val}</span>}
                  />
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
           </div>
        </Card>
      </div>

      {/* Logs Table */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
           <h3 className="font-black text-navy">{t('campaigns.detail.log_title', 'Alıcı Detayları')}</h3>
           <div className="flex gap-2">
              <select 
                className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs font-bold text-navy outline-none"
                value={logFilter.completed}
                onChange={(e) => setLogFilter({ ...logFilter, completed: e.target.value })}
              >
                <option value="">{t('campaigns.detail.filter_all', 'Tüm Durumlar')}</option>
                <option value="true">{t('campaigns.detail.filter_completed', 'Tamamladı')}</option>
                <option value="false">{t('campaigns.detail.filter_not_completed', 'Tamamlamadı')}</option>
              </select>
           </div>

        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white">
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">{t('campaigns.detail.columns.email', 'E-posta')}</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">{t('campaigns.detail.columns.opened', 'Açıldı')}</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">{t('campaigns.detail.columns.clicked', 'Tıkladı')}</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">{t('campaigns.detail.columns.completed', 'Tamamladı')}</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">{t('campaigns.detail.filter_bounced', 'Bounce')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoadingLogs ? (
                <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></td></tr>
              ) : logsData?.items.map((log: any) => (
                <tr key={log.id} className="hover:bg-gray-50/30 transition-colors">
                  <td className="p-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-navy">{log.fullName}</span>
                      <span className="text-xs text-gray-400">{log.email}</span>
                    </div>
                  </td>
                  <td className="p-6 text-center">{log.opened_at ? <Badge variant="yellow">✓</Badge> : <span className="text-gray-200">—</span>}</td>
                  <td className="p-6 text-center">{log.clicked_at ? <Badge variant="blue">✓</Badge> : <span className="text-gray-200">—</span>}</td>
                  <td className="p-6 text-center">{log.completed_at ? <Badge variant="green">✓</Badge> : <span className="text-gray-200">—</span>}</td>
                  <td className="p-6 text-center">
                    {log.status === 'bounced' ? (
                      <div className="relative group cursor-help inline-block">
                        <Badge variant="red">!</Badge>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-navy text-white text-[10px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                          {log.bounce_reason || t('campaigns.detail.columns.bounce_hint', 'Mail adresi geçersiz veya posta kutusu dolu.')}
                        </div>
                      </div>

                    ) : <span className="text-gray-200">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function MetricCard({ label, value, subValue, icon }: { label: string; value: any; subValue: string; icon: React.ReactNode }) {
  return (
    <Card className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
          {icon}
        </div>
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
      </div>
      <div>
        <h3 className="text-3xl font-black text-navy">{value}</h3>
        <p className="text-xs font-bold text-gray-400 mt-1">{subValue}</p>
      </div>
    </Card>
  );
}
