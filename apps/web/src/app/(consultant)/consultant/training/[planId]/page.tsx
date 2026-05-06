'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { 
  ChevronLeft, Plus, Calendar, Clock, MapPin, 
  Video, BookOpen, PenTool, CheckSquare, 
  Trash2, Edit3, Send, Link as LinkIcon, BarChart3, Loader2 
} from 'lucide-react';
import toast from 'react-hot-toast';
import client from '@/lib/api/client';

export default function TrainingPlanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const planId = params.planId as string;

  const [plan, setPlan] = useState<any>(null);
  const [contentItems, setContentItems] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [engagementData, setEngagementData] = useState<Record<string, any>>({});
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);

  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    event_type: 'session',
    scheduled_at: '',
    duration_minutes: 60,
    content_item_id: '',
    department_id: '',
    external_url: '',
    external_url_label: '',
  });

  const fetchData = async () => {
    try {
      const [planRes, contentRes] = await Promise.all([
        client.get(`/consultant/training/plans/${planId}`),
        client.get('/consultant/content'),
      ]);
      setPlan(planRes.data?.data || planRes.data);
      setContentItems(contentRes.data?.data || contentRes.data || []);
      
      // Get departments for the plan's company
      const companyId = (planRes.data?.data || planRes.data).companyId;
      const deptRes = await client.get(`/consultant/companies/${companyId}/departments`);
      setDepartments(deptRes.data?.data || deptRes.data || []);

      // Fetch engagement for events with content
      const eventList = (planRes.data?.data || planRes.data).events || [];
      const engagement: Record<string, any> = {};
      for (const event of eventList) {
        if (event.contentItemId) {
          try {
            const eRes = await client.get(`/consultant/training/content/${event.contentItemId}/engagement`);
            engagement[event.id] = eRes.data || [];
          } catch (err) {}
        }
      }
      setEngagementData(engagement);
      
    } catch (err) {
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [planId]);

  const handleOpenAddModal = () => {
    setEditingEvent(null);
    setEventForm({
      title: '',
      description: '',
      event_type: 'session',
      scheduled_at: '',
      duration_minutes: 60,
      content_item_id: '',
      department_id: '',
      external_url: '',
      external_url_label: '',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (event: any) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description || '',
      event_type: event.eventType,
      scheduled_at: event.scheduledAt ? new Date(event.scheduledAt).toISOString().slice(0, 16) : '',
      duration_minutes: event.durationMinutes,
      content_item_id: event.contentItemId || '',
      department_id: event.departmentId || '',
      external_url: event.externalUrl || '',
      external_url_label: event.externalUrlLabel || '',
    });
    setShowModal(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      if (editingEvent) {
        await client.put(`/consultant/training/events/${editingEvent.id}`, eventForm);
        toast.success('Etkinlik güncellendi');
      } else {
        await client.post(`/consultant/training/plans/${planId}/events`, {
          ...eventForm,
          company_id: plan.companyId,
        });
        toast.success('Etkinlik eklendi');
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Kaydedilemedi');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Bu etkinliği silmek istediğinize emin misiniz?')) return;
    try {
      await client.delete(`/consultant/training/events/${eventId}`);
      toast.success('Etkinlik silindi');
      fetchData();
    } catch (err) {
      toast.error('Silinemedi');
    }
  };

  const handlePublish = async () => {
    if (!confirm('Planı yayınlamak istediğinize emin misiniz? HR adminlere bildirim gidecektir.')) return;
    try {
      await client.post(`/consultant/training/plans/${planId}/publish`);
      toast.success('Plan yayınlandı');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Yayınlanamadı');
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'session': return <PenTool size={18} className="text-blue-500" />;
      case 'webinar': return <Video size={18} className="text-purple-500" />;
      case 'workshop': return <PenTool size={18} className="text-orange-500" />;
      case 'reading': return <BookOpen size={18} className="text-emerald-500" />;
      case 'task': return <CheckSquare size={18} className="text-indigo-500" />;
      default: return <Calendar size={18} />;
    }
  };

  const getEventTypeLabel = (type: string) => {
    const labels: any = { session: 'Eğitim', webinar: 'Webinar', workshop: 'Atölye', reading: 'Okuma', task: 'Görev' };
    return labels[type] || type;
  };

  if (loading) return <div className="p-12 text-center text-slate-500">Yükleniyor...</div>;
  if (!plan) return <div className="p-12 text-center text-slate-500">Plan bulunamadı</div>;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-4">
          <button onClick={() => router.push('/consultant/training')} className="p-2 hover:bg-slate-100 rounded-full transition-colors mt-1">
            <ChevronLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-slate-900">{plan.title}</h1>
              {plan.status === 'draft' ? (
                <Badge variant="yellow">Taslak</Badge>
              ) : (
                <Badge variant="green">Yayında</Badge>
              )}
            </div>
            <p className="text-slate-500">{plan.company?.name} · {plan.events?.length || 0} Etkinlik</p>
          </div>
        </div>
        <div className="flex gap-2">
          {plan.status === 'draft' && (
            <Button onClick={handlePublish} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Send size={18} />
              Planı Yayınla
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Calendar size={18} />
                Eğitim Takvimi
              </h3>
              <Button size="sm" onClick={handleOpenAddModal} className="text-xs h-8 flex items-center gap-1">
                <Plus size={14} /> Etkinlik Ekle
              </Button>
            </div>

            <div className="divide-y divide-slate-50">
              {plan.events?.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <p>Henüz etkinlik eklenmemiş.</p>
                  <Button variant="ghost" size="sm" onClick={handleOpenAddModal}>İşlem başlatın</Button>
                </div>
              ) : (
                plan.events.map((event: any) => (
                  <div key={event.id} className="p-4 hover:bg-slate-50/50 transition-colors group">
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center justify-center min-w-[64px] py-2 px-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                        <span className="text-xs font-bold text-indigo-600 uppercase">
                          {new Date(event.scheduledAt).toLocaleDateString('tr-TR', { month: 'short' })}
                        </span>
                        <span className="text-xl font-black text-slate-900 leading-none">
                          {new Date(event.scheduledAt).getDate()}
                        </span>
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          {getEventTypeIcon(event.eventType)}
                          <h4 className="font-bold text-slate-900">{event.title}</h4>
                        </div>
                        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {new Date(event.scheduledAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} · {event.durationMinutes} dk
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin size={12} />
                            {event.department?.name_tr || 'Tüm Firma'}
                          </span>
                        </div>
                        {event.description && (
                          <p className="text-sm text-slate-600 line-clamp-2 mt-2">{event.description}</p>
                        )}
                        {event.contentItem && (
                          <div className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-md w-fit text-xs font-medium">
                            <BookOpen size={12} />
                            {event.contentItem.title_tr}
                          </div>
                        )}
                        {event.externalUrl && (
                          <div className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-md w-fit text-xs font-medium">
                            <LinkIcon size={12} />
                            {event.externalUrlLabel || 'Harici Link'}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenEditModal(event)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteEvent(event.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-4 space-y-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <BarChart3 size={18} className="text-indigo-500" />
              İçerik Analitiği
            </h3>
            <div className="space-y-4">
              {Object.keys(engagementData).length === 0 ? (
                <div className="text-sm text-slate-500 italic text-center py-4">
                  Henüz etkileşim verisi bulunmuyor.
                </div>
              ) : (
                plan.events?.filter((e: any) => e.contentItemId).map((event: any) => {
                  const data = engagementData[event.id] || [];
                  const views = data.filter((d: any) => d.action === 'view').reduce((acc: number, d: any) => acc + parseInt(d.count), 0);
                  const clicks = data.filter((d: any) => d.action === 'click').reduce((acc: number, d: any) => acc + parseInt(d.count), 0);
                  const notifies = data.filter((d: any) => d.action === 'notify').reduce((acc: number, d: any) => acc + parseInt(d.count), 0);

                  return (
                    <div key={event.id} className="space-y-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-xs font-bold text-slate-700 line-clamp-1">{event.title}</div>
                      <div className="grid grid-cols-3 gap-1">
                        <div className="bg-white p-2 rounded border border-slate-50 text-center">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Tıklama</div>
                          <div className="text-sm font-black text-indigo-600">{clicks}</div>
                        </div>
                        <div className="bg-white p-2 rounded border border-slate-50 text-center">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Gör.</div>
                          <div className="text-sm font-black text-slate-900">{views}</div>
                        </div>
                        <div className="bg-white p-2 rounded border border-slate-50 text-center">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Bildirim</div>
                          <div className="text-sm font-black text-emerald-600">{notifies}</div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          <Card className="p-4 space-y-3 bg-indigo-50/50 border-indigo-100">
            <h3 className="font-bold text-indigo-900 text-sm">Plan Özeti</h3>
            <p className="text-sm text-indigo-700 leading-relaxed">
              {plan.description || 'Bu plan için açıklama girilmemiş.'}
            </p>
            <div className="pt-2 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-indigo-600 font-medium">Başlangıç:</span>
                <span className="text-slate-700">{plan.startsAt ? new Date(plan.startsAt).toLocaleDateString('tr-TR') : '-'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-indigo-600 font-medium">Bitiş:</span>
                <span className="text-slate-700">{plan.endsAt ? new Date(plan.endsAt).toLocaleDateString('tr-TR') : '-'}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingEvent ? 'Etkinliği Düzenle' : 'Yeni Etkinlik Ekle'}>
        <form onSubmit={handleSaveEvent} className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Etkinlik Başlığı</label>
              <Input 
                value={eventForm.title} 
                onChange={e => setEventForm({ ...eventForm, title: e.target.value })} 
                placeholder="Örn: Stres Yönetimi Atölyesi" 
                required 
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Tür</label>
              <select
                value={eventForm.event_type}
                onChange={e => setEventForm({ ...eventForm, event_type: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm"
              >
                <option value="session">Eğitim Oturumu</option>
                <option value="webinar">Webinar</option>
                <option value="workshop">Atölye</option>
                <option value="reading">Okuma Görevi</option>
                <option value="task">Görev</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Departman</label>
              <select
                value={eventForm.department_id}
                onChange={e => setEventForm({ ...eventForm, department_id: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm"
              >
                <option value="">Tüm Firma</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name_tr}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Tarih & Saat</label>
              <Input 
                type="datetime-local" 
                value={eventForm.scheduled_at} 
                onChange={e => setEventForm({ ...eventForm, scheduled_at: e.target.value })} 
                required 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Süre (Dakika)</label>
              <Input 
                type="number" 
                value={eventForm.duration_minutes} 
                onChange={e => setEventForm({ ...eventForm, duration_minutes: parseInt(e.target.value) })} 
                required 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Açıklama</label>
            <Textarea 
              value={eventForm.description} 
              onChange={e => setEventForm({ ...eventForm, description: e.target.value })} 
              placeholder="Etkinlik hakkında kısa bilgi..." 
              rows={3} 
            />
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase text-indigo-600">İçerik Kütüphanesinden Seç</label>
              <select
                value={eventForm.content_item_id}
                onChange={e => setEventForm({ ...eventForm, content_item_id: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm"
              >
                <option value="">İçerik Seçin...</option>
                {contentItems.map(c => (
                  <option key={c.id} value={c.id}>{c.title_tr}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase">Veya Harici Link Ekle</label>
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  placeholder="URL (örn: Zoom/Teams linki)" 
                  value={eventForm.external_url} 
                  onChange={e => setEventForm({ ...eventForm, external_url: e.target.value })} 
                />
                <Input 
                  placeholder="Link Etiketi (örn: Toplantıya Katıl)" 
                  value={eventForm.external_url_label} 
                  onChange={e => setEventForm({ ...eventForm, external_url_label: e.target.value })} 
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>İptal</Button>
            <Button type="submit" disabled={modalLoading} className="flex items-center gap-2">
              {modalLoading && <Loader2 className="animate-spin" size={16} />}
              {editingEvent ? 'Güncelle' : 'Ekle'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
