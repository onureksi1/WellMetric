'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Bot, 
  ClipboardList, 
  History, 
  ArrowRight, 
  Zap, 
  TrendingDown, 
  TrendingUp,
  Video,
  FileText,
  CheckCircle
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  ResponsiveContainer 
} from 'recharts';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import client from '@/lib/api/client';
import { useAuthStore } from '@/lib/store/auth.store';
import { format } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

const DEFAULT_RADAR = [
  { subject: 'Fiziksel', A: 0, fullMark: 100 },
  { subject: 'Zihinsel', A: 0, fullMark: 100 },
  { subject: 'Sosyal', A: 0, fullMark: 100 },
  { subject: 'Finansal', A: 0, fullMark: 100 },
  { subject: 'İş & Anlam', A: 0, fullMark: 100 },
];

export default function EmployeeDashboard() {
  const { user } = useAuthStore();
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'tr' ? tr : enUS;

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['employee-me'],
    queryFn: async () => {
      const res = await client.get('/employee/me');
      return res.data;
    }
  });

  if (isLoading) return <div className="flex justify-center py-20 text-gray-400">Yükleniyor...</div>;

  const score = dashboard?.latest_score?.overall || 0;
  const change = dashboard?.score_change || 0;
  
  const radarData = dashboard?.latest_score ? [
    { subject: t('dimensions.physical', 'Fiziksel'), A: dashboard.latest_score.physical || 0, fullMark: 100 },
    { subject: t('dimensions.mental', 'Zihinsel'), A: dashboard.latest_score.mental || 0, fullMark: 100 },
    { subject: t('dimensions.social', 'Sosyal'), A: dashboard.latest_score.social || 0, fullMark: 100 },
    { subject: t('dimensions.financial', 'Finansal'), A: dashboard.latest_score.financial || 0, fullMark: 100 },
    { subject: t('dimensions.work', 'İş & Anlam'), A: dashboard.latest_score.work || 0, fullMark: 100 },
  ] : DEFAULT_RADAR;

  const pendingSurvey = dashboard?.pending_surveys?.[0];
  const history = dashboard?.history || [];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Welcome & Stats */}
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="flex-1 space-y-6">
          <div>
            <h1 className="text-3xl font-black text-navy leading-tight">Merhaba {user?.full_name?.split(' ')[0]} 👋</h1>
            <p className="text-gray-500 font-medium">{user?.role?.replace('_', ' ')} · {dashboard?.company_name}</p>
          </div>

          <Card className="bg-primary/5 border-primary/20 p-6 relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Bu Ayki Wellbeing Skorun</p>
              <div className="flex items-baseline gap-4">
                 <h2 className="text-5xl font-black text-navy">{score} <span className="text-xl font-bold text-gray-400">/ 100</span></h2>
                 {change !== 0 && (
                   <div className={`flex items-center gap-1 font-bold text-xs ${change > 0 ? 'text-primary' : 'text-danger'}`}>
                      {change > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {Math.abs(change)} PUAN {change > 0 ? 'ARTTI' : 'DÜŞTÜ'}
                   </div>
                 )}
              </div>
              <p className="text-xs text-gray-400 mt-4 max-w-[240px]">
                {score === 0 ? 'Henüz anket doldurmadın.' : 'Geçen aya göre skorun değişti.'}
              </p>
            </div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-10 group-hover:opacity-20 transition-opacity">
               <Zap size={180} />
            </div>
          </Card>
        </div>

        <Card className="w-full md:w-80 h-[280px]">
           <ResponsiveContainer width="100%" height="100%">
             <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
               <PolarGrid stroke="#f1f5f9" />
               <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
               <Radar
                 name="Wellbeing"
                 dataKey="A"
                 stroke="#2E865A"
                 fill="#2E865A"
                 fillOpacity={0.6}
               />
             </RadarChart>
           </ResponsiveContainer>
        </Card>
      </div>

      {/* Pending Survey */}
      {pendingSurvey ? (
        <Card className="bg-navy text-white border-none shadow-2xl relative overflow-hidden">
           <div className="absolute right-0 top-0 p-8 opacity-10">
              <ClipboardList size={140} />
           </div>
           <div className="relative z-10">
              <Badge variant="blue" className="!bg-primary !text-white border-none mb-4">BEKLEYEN ANKET</Badge>
              <h3 className="text-2xl font-bold mb-2">{pendingSurvey.title}</h3>
              <p className="text-gray-400 text-sm mb-6 max-w-md">Bu ayki durumunu paylaşarak esenlik yolculuğuna devam et. Sadece 5 dakikanı alacak.</p>
              
              <div className="flex items-center gap-6 mb-8">
                 <div className="text-xs">
                    <p className="text-gray-500 font-bold uppercase tracking-wider mb-1">Son Tarih</p>
                    <p className="font-bold">{format(new Date(pendingSurvey.due_at), 'd MMMM yyyy', { locale: dateLocale })}</p>
                 </div>
                 <div className="h-8 w-px bg-white/10" />
                 <div className="text-xs">
                    <p className="text-gray-500 font-bold uppercase tracking-wider mb-1">Tahmini Süre</p>
                    <p className="font-bold">~5 Dakika</p>
                 </div>
              </div>

              <Link href={`/me/survey/${pendingSurvey.id}`}>
                <Button className="w-full sm:w-auto px-8 py-4 font-bold shadow-lg shadow-primary/20">
                   ANKETİ DOLDUR <ArrowRight size={18} className="ml-2" />
                </Button>
              </Link>
           </div>
        </Card>
      ) : (
        <Card className="bg-gray-50 border-dashed border-2 flex flex-col items-center justify-center py-12 text-center">
           <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center text-gray-300 shadow-sm mb-4">
              <CheckCircle size={32} />
           </div>
           <h3 className="text-lg font-bold text-navy">Tüm Anketler Tamamlandı!</h3>
           <p className="text-sm text-gray-400 mt-1">Şu an için bekleyen bir anketin bulunmuyor.</p>
        </Card>
      )}

      {/* Content Recommendations */}
      <div className="space-y-6">
         <h3 className="text-sm font-black text-navy uppercase tracking-widest flex items-center gap-2">
            <Bot size={18} className="text-primary" />
            Senin İçin Seçtiğimiz İçerikler
         </h3>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ContentCard 
              type="webinar" 
              title="Stres Yönetimi ve Mindfulness" 
              dimension="Zihinsel" 
              info="15 Nisan, Online" 
              icon={Video}
              color="purple"
            />
            <ContentCard 
              type="article" 
              title="Ergonomi ve Ev-Ofis Egzersizleri" 
              dimension="Fiziksel" 
              info="8 Dakika Okuma" 
              icon={FileText}
              color="green"
            />
         </div>
      </div>

      {/* History */}
      <div className="space-y-6">
         <h3 className="text-sm font-black text-navy uppercase tracking-widest flex items-center gap-2">
            <History size={18} className="text-gray-400" />
            Geçmiş Anketlerin
         </h3>
         
         <Card>
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                  <thead className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                     <tr>
                        <th className="py-4 px-4">Anket</th>
                        <th className="py-4 px-4">Tarih</th>
                        <th className="py-4 px-4 text-center">Skorun</th>
                        <th className="py-4 px-4 text-right">Detay</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                      {history.map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50/50 transition-colors group cursor-pointer">
                           <td className="py-4 px-4 font-bold text-navy">{row.title}</td>
                           <td className="py-4 px-4 text-gray-500 font-medium">
                             {format(new Date(row.submitted_at), 'd MMM yyyy', { locale: dateLocale })}
                           </td>
                           <td className="py-4 px-4 text-center font-black text-navy">{row.score}</td>
                           <td className="py-4 px-4 text-right">
                              <Button variant="ghost" size="sm" className="p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <ArrowRight size={18} className="text-primary" />
                              </Button>
                           </td>
                        </tr>
                      ))}
                      {history.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-gray-400 italic">
                             Henüz tamamlanmış bir anketiniz bulunmuyor.
                          </td>
                        </tr>
                      )}
                   </tbody>
               </table>
            </div>
         </Card>
      </div>
    </div>
  );
}

function ContentCard({ type, title, dimension, info, icon: Icon, color }: any) {
  return (
    <Card className="group hover:border-primary/20 transition-all cursor-pointer">
       <div className="flex justify-between items-start mb-6">
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
            color === 'purple' ? 'bg-purple-50 text-purple-500' : 'bg-green-50 text-green-500'
          }`}>
             <Icon size={24} />
          </div>
          <Badge variant={color === 'purple' ? 'purple' : 'green'}>{dimension.toUpperCase()}</Badge>
       </div>
       <h4 className="text-lg font-bold text-navy mb-1 group-hover:text-primary transition-colors">{title}</h4>
       <p className="text-xs text-gray-400 font-medium">{info}</p>
       <div className="mt-6 flex justify-end">
          <Button variant="ghost" size="sm" className="text-primary text-[10px] font-black tracking-widest gap-2">
             {type === 'webinar' ? 'KAYIT OL' : 'İNCELE'} <ArrowRight size={14} />
          </Button>
       </div>
    </Card>
  );
}
