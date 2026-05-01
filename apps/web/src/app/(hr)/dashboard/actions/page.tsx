'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Plus, 
  Bot, 
  Zap, 
  Calendar, 
  Users, 
  CheckCircle2,
  Clock,
  Layout,
  MoreHorizontal,
  ExternalLink,
  RefreshCcw
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';

export default function ActionsPage() {
  const { t } = useTranslation('dashboard');
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-navy">{t('actions.title')}</h1>
          <p className="text-sm text-gray-500">{t('actions.subtitle')}</p>
        </div>
        <Button className="flex gap-2">
          <Plus size={18} />
          {t('actions.new')}
        </Button>
      </div>

      {/* AI Suggestions Section */}
      <Card className="bg-navy text-white border-none relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Zap size={140} />
        </div>
        <div className="relative z-10">
           <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                <Bot size={22} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold">{t('actions.ai_suggestions.title', 'Yapay Zeka Destekli Öneriler')}</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  {t('actions.ai_suggestions.based_on', { date: 'Nisan 2026', defaultValue: 'Nisan 2026 Verilerine Göre' })}
                </p>
              </div>
           </div>
 
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all cursor-pointer group">
                 <div className="flex justify-between items-start mb-4">
                    <Badge variant="red" className="!bg-danger/20 !text-white border-none">
                      {t('actions.ai_suggestions.critical_mental', 'KRİTİK: ZİHİNSEL')}
                    </Badge>
                    <span className="text-[10px] text-gray-400 font-bold">44 {t('common.score_unit', 'PUAN')}</span>
                 </div>
                 <h4 className="font-bold text-sm mb-2 group-hover:text-primary transition-colors">
                   {t('actions.ai_suggestions.stress_webinar.title', 'Stres Yönetimi ve Resiliance Webinarı')}
                 </h4>
                 <p className="text-xs text-gray-400 leading-relaxed mb-4">
                   {t('actions.ai_suggestions.stress_webinar.desc', 'Yazılım departmanındaki stres seviyesini düşürmek için online etkinlik önerilir.')}
                 </p>
                 <div className="flex items-center gap-2">
                    <Button size="sm" className="text-[10px] h-8 bg-primary hover:bg-primary-dark">
                      {t('actions.create_action', 'Aksiyon Oluştur')}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-[10px] h-8 text-white border border-white/10 hover:bg-white/5">
                      {t('actions.review_content', 'İçeriği İncele')}
                    </Button>
                 </div>
              </div>
 
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all cursor-pointer group">
                 <div className="flex justify-between items-start mb-4">
                    <Badge variant="yellow" className="!bg-warning/20 !text-white border-none">
                      {t('actions.ai_suggestions.caution_physical', 'DİKKAT: FİZİKSEL')}
                    </Badge>
                    <span className="text-[10px] text-gray-400 font-bold">58 {t('common.score_unit', 'PUAN')}</span>
                 </div>
                 <h4 className="font-bold text-sm mb-2 group-hover:text-warning transition-colors">
                   {t('actions.ai_suggestions.ergonomics_guide.title', 'Ergonomi ve Ofis Egzersizleri Rehberi')}
                 </h4>
                 <p className="text-xs text-gray-400 leading-relaxed mb-4">
                   {t('actions.ai_suggestions.ergonomics_guide.desc', 'Remote çalışanlar için ev ofis düzenleme rehberi paylaşımı önerilir.')}
                 </p>
                 <div className="flex items-center gap-2">
                    <Button size="sm" className="text-[10px] h-8 bg-warning hover:bg-warning-dark">
                      {t('actions.create_action', 'Aksiyon Oluştur')}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-[10px] h-8 text-white border border-white/10 hover:bg-white/5">
                      {t('actions.review_content', 'İçeriği İncele')}
                    </Button>
                 </div>
              </div>
           </div>
        </div>
      </Card>


      {/* Actions Board (Simplified Kanban) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <ActionColumn title={t('actions.status.todo', 'Planlandı')} count={2} color="bg-gray-100" text="text-gray-500">
            <ActionCard 
              title={t('actions.examples.yoga.title', 'Yoga Seansları (Haftalık)')} 
              dimension="physical" 
              dept={t('common.all_company', 'Tüm Şirket')} 
              date="20 Nis" 
              status="todo"
            />
         </ActionColumn>

         <ActionColumn title={t('actions.status.doing', 'Devam Ediyor')} count={1} color="bg-blue-50" text="text-blue-500">
            <ActionCard 
              title={t('actions.examples.stress_training.title', 'Stres Yönetimi Eğitimi')} 
              dimension="mental" 
              dept={t('common.departments.it', 'Yazılım')} 
              date="15 Nis" 
              status="doing"
            />
         </ActionColumn>

         <ActionColumn title={t('actions.status.done', 'Tamamlandı')} count={5} color="bg-primary/5" text="text-primary">
            <ActionCard 
              title={t('actions.examples.finance_guide.title', 'Finansal Planlama Rehberi')} 
              dimension="financial" 
              dept={t('common.all_company', 'Tüm Şirket')} 
              date="1 Nis" 
              status="done"
            />
         </ActionColumn>
      </div>

    </div>
  );
}

function ActionColumn({ title, count, color, text, children }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-2">
         <h3 className="text-sm font-black text-navy uppercase tracking-widest flex items-center gap-2">
           <div className={`h-2 w-2 rounded-full ${color.replace('bg-', 'bg-opacity-100 bg-')}`} />
           {title}
         </h3>
         <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${color} ${text}`}>{count}</span>
      </div>
      <div className="space-y-4 min-h-[400px]">
        {children}
      </div>
    </div>
  );
}

function ActionCard({ title, dimension, dept, date, status }: any) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all group cursor-pointer border-l-4 border-l-transparent hover:border-l-primary">
       <div className="flex justify-between items-start mb-3">
          <Badge variant={dimension === 'physical' ? 'blue' : dimension === 'mental' ? 'purple' : 'green'} size="sm">
             {dimension.toUpperCase()}
          </Badge>
          <button className="text-gray-300 hover:text-navy opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizontal size={16} />
          </button>
       </div>
       <h4 className="text-sm font-bold text-navy mb-4 group-hover:text-primary transition-colors">{title}</h4>
       
       <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                <Users size={12} />
                {dept}
             </div>
             <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                <Clock size={12} />
                {date}
             </div>
          </div>
          {status === 'done' ? (
            <CheckCircle2 size={16} className="text-primary" />
          ) : status === 'doing' ? (
            <RefreshCcw size={16} className="text-blue-500 animate-spin-slow" />
          ) : (
            <div className="h-4 w-4 rounded-full border-2 border-gray-100" />
          )}
       </div>
    </div>
  );
}
