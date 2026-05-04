'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Plus, Bot, Zap, Calendar, Users, CheckCircle2,
  Clock, MoreHorizontal, RefreshCcw, Loader2, ClipboardList, Sparkles
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import client from '@/lib/api/client';
import toast from 'react-hot-toast';

const DIMENSIONS = ['mental', 'physical', 'social', 'financial', 'work'];
const DIM_LABELS: Record<string, string> = {
  mental: 'Zihinsel', physical: 'Fiziksel', social: 'Sosyal', financial: 'Finansal', work: 'İş Hayatı',
};
const DIM_COLORS: Record<string, string> = {
  mental: 'purple', physical: 'blue', social: 'green', financial: 'yellow', work: 'gray',
};

const STATUS_COLUMNS = [
  { key: 'planned',     label: 'Planlandı',     color: 'bg-gray-100',    text: 'text-gray-500'  },
  { key: 'in_progress', label: 'Devam Ediyor',   color: 'bg-blue-50',    text: 'text-blue-500'  },
  { key: 'completed',   label: 'Tamamlandı',     color: 'bg-primary/5',  text: 'text-primary'   },
];

export default function ActionsPage() {
  const { t } = useTranslation('dashboard');
  const queryClient = useQueryClient();
  const [selectedDim, setSelectedDim] = useState('mental');
  const [showCreate, setShowCreate] = useState(false);
  const [newAction, setNewAction] = useState({ title: '', description: '', dimension: 'mental', due_date: '' });

  const { data: actionsData, isLoading } = useQuery({
    queryKey: ['hr-actions'],
    queryFn: async () => { const { data } = await client.get('/hr/actions'); return data; },
  });

  const { data: suggestions, isLoading: loadingSuggestions } = useQuery({
    queryKey: ['hr-action-suggestions', selectedDim],
    queryFn: async () => { const { data } = await client.get(`/hr/actions/suggestions?dimension=${selectedDim}`); return data; },
  });

  const createMutation = useMutation({
    mutationFn: async (dto: any) => { await client.post('/hr/actions', dto); },
    onSuccess: () => {
      toast.success('Aksiyon oluşturuldu!');
      queryClient.invalidateQueries({ queryKey: ['hr-actions'] });
      setShowCreate(false);
      setNewAction({ title: '', description: '', dimension: 'mental', due_date: '' });
    },
    onError: () => toast.error('Aksiyon oluşturulamadı.'),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await client.patch(`/hr/actions/${id}/status`, { status });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hr-actions'] }),
    onError: () => toast.error('Durum güncellenemedi.'),
  });

  const items: any[] = actionsData?.items ?? [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-navy">{t('actions.title', 'Aksiyon Planları')}</h1>
          <p className="text-sm text-gray-500">{t('actions.subtitle', 'Wellbeing aksiyonlarını yönetin ve takip edin')}</p>
        </div>
        <Button className="flex gap-2" onClick={() => setShowCreate(true)}>
          <Plus size={18} /> Yeni Aksiyon
        </Button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card className="p-6 border-2 border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-top-2">
          <h3 className="font-black text-navy mb-4 flex items-center gap-2"><Plus size={18} /> Yeni Aksiyon Oluştur</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30 md:col-span-2"
              placeholder="Aksiyon başlığı..."
              value={newAction.title}
              onChange={e => setNewAction({ ...newAction, title: e.target.value })}
            />
            <textarea
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30 min-h-[80px] md:col-span-2"
              placeholder="Açıklama (opsiyonel)..."
              value={newAction.description}
              onChange={e => setNewAction({ ...newAction, description: e.target.value })}
            />
            <select
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/30"
              value={newAction.dimension}
              onChange={e => setNewAction({ ...newAction, dimension: e.target.value })}
            >
              {DIMENSIONS.map(d => <option key={d} value={d}>{DIM_LABELS[d]}</option>)}
            </select>
            <input
              type="date"
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
              value={newAction.due_date}
              onChange={e => setNewAction({ ...newAction, due_date: e.target.value })}
            />
          </div>
          <div className="flex gap-3 mt-4">
            <Button onClick={() => createMutation.mutate(newAction)} disabled={!newAction.title || createMutation.isPending} className="gap-2">
              {createMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Oluştur
            </Button>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>İptal</Button>
          </div>
        </Card>
      )}

      {/* AI Suggestions */}
      <Card className="bg-navy text-white border-none relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10"><Zap size={140} /></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                <Bot size={22} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Yapay Zeka Destekli Öneriler</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Boyuta Göre İçerik Önerileri</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {DIMENSIONS.map(d => (
                <button
                  key={d}
                  onClick={() => setSelectedDim(d)}
                  className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest transition-all ${selectedDim === d ? 'bg-primary text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
                >
                  {DIM_LABELS[d]}
                </button>
              ))}
            </div>
          </div>

          {loadingSuggestions ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" /></div>
          ) : suggestions?.suggested_content?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestions.suggested_content.map((item: any) => (
                <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all group">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={14} className="text-primary" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">{item.type}</span>
                  </div>
                  <h4 className="font-bold text-sm mb-2 group-hover:text-primary transition-colors">{item.title_tr}</h4>
                  {item.description_tr && <p className="text-xs text-gray-400 leading-relaxed mb-3 line-clamp-2">{item.description_tr}</p>}
                  <Button
                    size="sm"
                    className="text-[10px] h-8 bg-primary hover:bg-primary/80 w-full"
                    onClick={() => {
                      setNewAction({ title: item.title_tr, description: item.description_tr ?? '', dimension: selectedDim, due_date: '' });
                      setShowCreate(true);
                    }}
                  >
                    Aksiyon Oluştur
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-400">
              <Sparkles size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm font-bold">Bu boyut için içerik önerisi bulunamadı</p>
              <p className="text-xs opacity-60 mt-1">İçerik havuzuna ekleme yapıldıkça öneriler görünecek</p>
            </div>
          )}
        </div>
      </Card>

      {/* Kanban Board */}
      <div>
        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <ClipboardList size={16} /> Aksiyon Panosu
        </h2>
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {STATUS_COLUMNS.map(col => {
              const colItems = items.filter(i => i.status === col.key);
              return (
                <div key={col.key} className="space-y-4">
                  <div className="flex justify-between items-center px-2">
                    <h3 className="text-sm font-black text-navy uppercase tracking-widest">{col.label}</h3>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${col.color} ${col.text}`}>{colItems.length}</span>
                  </div>
                  <div className="space-y-4 min-h-[200px]">
                    {colItems.length === 0 ? (
                      <div className="border-2 border-dashed border-gray-100 rounded-2xl h-32 flex items-center justify-center text-gray-300">
                        <p className="text-xs font-bold">Henüz aksiyon yok</p>
                      </div>
                    ) : colItems.map((action: any) => (
                      <div key={action.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all group cursor-pointer border-l-4 border-l-transparent hover:border-l-primary">
                        <div className="flex justify-between items-start mb-3">
                          <Badge variant={(DIM_COLORS[action.dimension] ?? 'gray') as any} size="sm">
                            {DIM_LABELS[action.dimension] ?? action.dimension}
                          </Badge>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {col.key === 'planned' && (
                              <button
                                className="text-[10px] font-black text-blue-500 hover:bg-blue-50 px-2 py-0.5 rounded-lg"
                                onClick={() => statusMutation.mutate({ id: action.id, status: 'in_progress' })}
                              >▶</button>
                            )}
                            {col.key === 'in_progress' && (
                              <button
                                className="text-[10px] font-black text-primary hover:bg-primary/10 px-2 py-0.5 rounded-lg"
                                onClick={() => statusMutation.mutate({ id: action.id, status: 'completed' })}
                              >✓</button>
                            )}
                          </div>
                        </div>
                        <h4 className="text-sm font-bold text-navy mb-3 group-hover:text-primary transition-colors">{action.title}</h4>
                        {action.description && <p className="text-xs text-gray-400 mb-3 line-clamp-2">{action.description}</p>}
                        <div className="flex items-center gap-3">
                          {action.department && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                              <Users size={12} /> {action.department.name}
                            </div>
                          )}
                          {action.due_date && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                              <Calendar size={12} /> {new Date(action.due_date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}
                            </div>
                          )}
                          {col.key === 'completed' && <CheckCircle2 size={14} className="text-primary ml-auto" />}
                          {col.key === 'in_progress' && <RefreshCcw size={14} className="text-blue-500 ml-auto" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
