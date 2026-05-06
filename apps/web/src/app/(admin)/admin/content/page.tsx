'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Search, 
  Video, 
  FileText, 
  Globe, 
  Calendar,
  MoreVertical,
  ExternalLink,
  Edit2
} from 'lucide-react';

const contentItems = [
  { id: 1, type: 'webinar', title: 'Stres Yönetimi ve Mindfulness', dimension: 'mental', score_threshold: 60, lang: ['tr', 'en'] },
  { id: 2, type: 'article', title: 'Düzenli Egzersizin Psikolojik Etkileri', dimension: 'physical', score_threshold: 70, lang: ['tr'] },
  { id: 3, type: 'pdf', title: 'Finansal Sağlık Rehberi 2026', dimension: 'financial', score_threshold: 50, lang: ['tr', 'en'] },
];

export default function ContentPage() {
  const { t } = useTranslation('admin');
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-navy">İçerik Yönetimi</h1>
          <p className="text-gray-500">Düşük skorlu boyutlar için önerilecek eğitim ve kaynaklar.</p>
        </div>
        <Button className="flex gap-2">
          <Plus size={18} />
          Yeni İçerik
        </Button>
      </div>

      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="İçerik başlığı ile ara..."
              className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>
          <div className="flex gap-3">
             <select className="flex-1 md:flex-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">{t('admin.content.all_types')}</option>
              <option value="article">{t('admin.content.types.article')}</option>
              <option value="video">{t('admin.content.types.video')}</option>
              <option value="podcast">{t('admin.content.types.podcast')}</option>
            </select>
            <select className="flex-1 md:flex-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">{t('admin.content.all_sizes')}</option>
              <option value="short">{t('admin.content.sizes.short')}</option>
              <option value="medium">{t('admin.content.sizes.medium')}</option>
              <option value="long">{t('admin.content.sizes.long')}</option>
            </select>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contentItems.map((item) => (
          <Card key={item.id} className="group hover:border-primary/20 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                item.type === 'webinar' ? 'bg-purple-50 text-purple-500' :
                item.type === 'pdf' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
              }`}>
                {item.type === 'webinar' ? <Video size={24} /> : 
                 item.type === 'pdf' ? <FileText size={24} /> : <Globe size={24} />}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" className="p-1.5"><Edit2 size={14} /></Button>
                <Button variant="ghost" size="sm" className="p-1.5"><MoreVertical size={14} /></Button>
              </div>
            </div>

            <h3 className="text-lg font-bold text-navy line-clamp-2 min-h-[3.5rem]">{item.title}</h3>
            
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant={
                item.dimension === 'mental' ? 'purple' : 
                item.dimension === 'physical' ? 'blue' : 'green'
              } size="md">
                {item.dimension.toUpperCase()}
              </Badge>
              <Badge variant="gray" size="md">
                Threshold: &lt; {item.score_threshold}
              </Badge>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
              <div className="flex gap-2">
                {item.lang.map(l => (
                  <span key={l} className="text-[10px] font-bold text-gray-400 uppercase border border-gray-100 px-1 rounded">
                    {l}
                  </span>
                ))}
              </div>
              <Button variant="ghost" size="sm" className="text-primary text-xs flex gap-1 items-center">
                <ExternalLink size={14} />
                Kaynağa Git
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
