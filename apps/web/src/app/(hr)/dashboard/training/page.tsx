'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { 
  Calendar as CalendarIcon, List, Clock, MapPin, 
  Video, BookOpen, PenTool, CheckSquare, 
  Send, CheckCircle2, ChevronLeft, ChevronRight, 
  Info, Loader2, Link as LinkIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import client from '@/lib/api/client';

export default function HrTrainingPage() {
  const { t, i18n } = useTranslation(['dashboard', 'common']);
  const [activeTab, setActiveTab] = useState<'list' | 'calendar'>('list');
  const [plans, setPlans] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const fetchData = async () => {
    try {
      const res = await client.get('/hr/training/plans');
      const plansData = res.data?.data || res.data || [];
      setPlans(plansData);
      
      // Flatten all events from published plans
      const allEvents = plansData.flatMap((p: any) => 
        p.events.map((e: any) => ({ ...e, planTitle: p.title }))
      );
      // Sort by date
      allEvents.sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
      setEvents(allEvents);
    } catch (err) {
      toast.error(t('dashboard.training.errors.load_failed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMarkComplete = async (eventId: string, notes?: string) => {
    try {
      await client.patch(`/hr/training/events/${eventId}/complete`, { notes });
      toast.success(t('dashboard.training.errors.mark_complete_success'));
      fetchData();
    } catch (err) {
      toast.error(t('dashboard.training.errors.generic_error'));
    }
  };

  const handleOpenNotify = (event: any) => {
    setSelectedEvent(event);
    setShowNotifyModal(true);
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'session': return <PenTool size={16} className="text-blue-500" />;
      case 'webinar': return <Video size={16} className="text-purple-500" />;
      case 'workshop': return <PenTool size={16} className="text-orange-500" />;
      case 'reading': return <BookOpen size={16} className="text-emerald-500" />;
      case 'task': return <CheckSquare size={16} className="text-indigo-500" />;
      default: return <CalendarIcon size={16} />;
    }
  };

  const logEngagement = async (contentItemId: string, eventId: string, url: string) => {
    try {
      await client.post(`/hr/training/content/${contentItemId}/log`, {
        action: 'click',
        training_event_id: eventId,
      });
    } catch (err) {
      // Silent error
    }
    window.open(url, '_blank', 'noreferrer');
  };

  if (loading) return <div className="p-12 text-center text-slate-500">{t('common.loading')}</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('dashboard.training.title')}</h1>
          <p className="text-slate-500">{t('dashboard.training.subtitle')}</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <List size={18} /> {t('dashboard.training.list')}
          </button>
          <button 
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'calendar' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <CalendarIcon size={18} /> {t('dashboard.training.calendar')}
          </button>
        </div>
      </div>

      {activeTab === 'list' ? (
        <div className="space-y-6">
          {events.length === 0 ? (
            <Card className="p-12 text-center text-slate-400">
              {t('dashboard.training.no_plans')}
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-slate-700">{t('dashboard.training.columns.date')}</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">{t('dashboard.training.columns.event')}</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">{t('dashboard.training.columns.scope')}</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">{t('dashboard.training.columns.status')}</th>
                      <th className="px-4 py-3 font-semibold text-slate-700 text-right">{t('dashboard.training.columns.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {events.map((event) => (
                      <tr key={event.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-900">
                              {new Date(event.scheduledAt).toLocaleDateString(i18n.language === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'long' })}
                            </span>
                            <span className="text-xs text-slate-500">
                              {new Date(event.scheduledAt).toLocaleTimeString(i18n.language === 'tr' ? 'tr-TR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2 mb-1">
                            {getEventTypeIcon(event.eventType)}
                            <span className="font-bold text-slate-900">{event.title}</span>
                          </div>
                          <div className="text-xs text-slate-500 line-clamp-1">{event.planTitle}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Badge variant="gray" className="text-[10px] uppercase font-bold tracking-wider">
                            {i18n.language === 'tr' ? (event.department?.name_tr || event.department?.name || 'Tüm Firma') : (event.department?.name_en || event.department?.name || 'Entire Company')}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {event.status === 'completed' ? (
                            <Badge variant="green" className="flex items-center gap-1 w-fit">
                              <CheckCircle2 size={12} /> {t('dashboard.training.status.completed')}
                            </Badge>
                          ) : (
                            <Badge variant="yellow">{t('dashboard.training.status.waiting')}</Badge>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right whitespace-nowrap">
                          <div className="flex justify-end gap-2">
                            {(event.contentItem || event.externalUrl) && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => logEngagement(
                                  event.contentItemId || 'external', 
                                  event.id, 
                                  event.contentItem?.url_tr || event.externalUrl
                                )}
                                className="h-8 px-2 text-indigo-600 hover:bg-indigo-50"
                              >
                                <LinkIcon size={14} className="mr-1" /> {t('dashboard.training.actions.content')}
                              </Button>
                            )}
                            {event.status !== 'completed' && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleOpenNotify(event)}
                                  className="h-8 px-2 flex items-center gap-1 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                >
                                  <Send size={14} /> {t('dashboard.training.actions.notify')}
                                </Button>
                                <Button 
                                  size="sm" 
                                  onClick={() => handleMarkComplete(event.id)}
                                  className="h-8 px-2 text-xs bg-slate-900 text-white"
                                >
                                  {t('dashboard.training.actions.done')}
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      ) : (
        <CalendarView events={events} onEventClick={handleOpenNotify} t={t} i18n={i18n} />
      )}

      {showNotifyModal && selectedEvent && (
        <NotifyModal 
          event={selectedEvent} 
          onClose={() => setShowNotifyModal(false)} 
          onSent={fetchData} 
          t={t}
          i18n={i18n}
        />
      )}
    </div>
  );
}

const CalendarView = ({ events, onEventClick, t, i18n }: { events: any[], onEventClick: (e: any) => void, t: any, i18n: any }) => {
  const [currentMonth, setMonth] = useState(new Date());

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const eventsByDay = events.reduce((acc, event) => {
    const d = new Date(event.scheduledAt);
    if (d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear()) {
      const day = d.getDate();
      if (!acc[day]) acc[day] = [];
      acc[day].push(event);
    }
    return acc;
  }, {} as Record<number, any[]>);

  const prevMonth = () => setMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide">
          {currentMonth.toLocaleDateString(i18n.language === 'tr' ? 'tr-TR' : 'en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={prevMonth}><ChevronLeft size={18} /></Button>
          <Button variant="outline" size="sm" onClick={() => setMonth(new Date())}>{t('dashboard.training.today')}</Button>
          <Button variant="outline" size="sm" onClick={nextMonth}><ChevronRight size={18} /></Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-slate-100 border border-slate-100 rounded-lg overflow-hidden">
        {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((d, idx) => (
          <div key={d} className="bg-slate-50 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
            {i18n.language === 'tr' ? d : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx]}
          </div>
        ))}

        {/* Empty cells for padding */}
        {Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-slate-50/30 min-h-[120px]" />
        ))}

        {/* Days of month */}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const dayEvents = eventsByDay[day] ?? [];
          const isToday = new Date().getDate() === day && new Date().getMonth() === currentMonth.getMonth() && new Date().getFullYear() === currentMonth.getFullYear();
          
          return (
            <div key={day} className={`bg-white min-h-[120px] p-2 border-slate-100 transition-colors hover:bg-slate-50/30 ${isToday ? 'ring-1 ring-inset ring-indigo-500/20 bg-indigo-50/10' : ''}`}>
              <div className={`text-sm font-medium mb-2 w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500'}`}>
                {day}
              </div>
              <div className="space-y-1">
                {dayEvents.map((event: any) => (
                  <div 
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className={`text-[10px] p-1.5 rounded border leading-tight cursor-pointer truncate shadow-sm transition-transform hover:scale-[1.02] ${
                      event.status === 'completed' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                        : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1">
                      {new Date(event.scheduledAt).toLocaleTimeString(i18n.language === 'tr' ? 'tr-TR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {event.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

const NotifyModal = ({ event, onClose, onSent, t, i18n }: { event: any, onClose: () => void, onSent: () => void, t: any, i18n: any }) => {
  const [target, setTarget] = useState<'company' | 'department'>('company');
  const [notes, setNotes] = useState('');
  const [extraEmails, setExtra] = useState('');
  const [sending, setSending] = useState(false);
  const [subject, setSubject] = useState(`${t('dashboard.training.notify_modal.subject_prefix')}: ${event.title}`);

  const handleSend = async () => {
    setSending(true);
    try {
      const res = await client.post(`/hr/training/events/${event.id}/notify`, {
        target,
        subject,
        notes,
        extra_emails: extraEmails ? extraEmails.split(',').map(e => e.trim()).filter(Boolean) : [],
      });
      toast.success(t('dashboard.training.notify_modal.success', { count: res.data?.recipients || 0 }));
      onSent();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('dashboard.training.errors.notify_failed'));
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={t('dashboard.training.notify_modal.title')}>
      <div className="p-6 space-y-5">
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-tight">{t('dashboard.training.notify_modal.event_label')}</div>
          <div className="font-bold text-slate-900">{event.title}</div>
          <div className="text-xs text-slate-500">
            {new Date(event.scheduledAt).toLocaleDateString(i18n.language === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-500 uppercase">{t('dashboard.training.notify_modal.target_label')}</label>
          <div className="flex gap-2">
            <button 
              onClick={() => setTarget('company')}
              className={`flex-1 p-3 rounded-lg border-2 text-left transition-all ${target === 'company' ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-100 bg-white hover:border-slate-200'}`}
            >
              <div className={`font-bold text-sm ${target === 'company' ? 'text-indigo-700' : 'text-slate-700'}`}>{t('dashboard.training.notify_modal.target_company')}</div>
              <div className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">{t('dashboard.training.notify_modal.target_company_desc')}</div>
            </button>
            <button 
              onClick={() => setTarget('department')}
              className={`flex-1 p-3 rounded-lg border-2 text-left transition-all ${target === 'department' ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-100 bg-white hover:border-slate-200'}`}
              disabled={!event.departmentId}
            >
              <div className={`font-bold text-sm ${target === 'department' ? 'text-indigo-700' : 'text-slate-700'}`}>{t('dashboard.training.notify_modal.target_dept')}</div>
              <div className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">
                {i18n.language === 'tr' 
                  ? (event.department?.name_tr || event.department?.name || t('dashboard.training.notify_modal.target_dept_unknown')) 
                  : (event.department?.name_en || event.department?.name || t('dashboard.training.notify_modal.target_dept_unknown'))
                }
              </div>
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase">{t('dashboard.training.notify_modal.subject_label')}</label>
          <Input value={subject} onChange={e => setSubject(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase">{t('dashboard.training.notify_modal.notes_label')}</label>
          <Textarea 
            placeholder={t('dashboard.training.notify_modal.notes_placeholder')} 
            rows={3} 
            value={notes} 
            onChange={e => setNotes(e.target.value)} 
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase">{t('dashboard.training.notify_modal.extra_emails_label')}</label>
          <Input 
            placeholder={t('dashboard.training.notify_modal.extra_emails_placeholder')} 
            value={extraEmails} 
            onChange={e => setExtra(e.target.value)} 
          />
        </div>

        <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
          <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={handleSend} disabled={sending} className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2">
            {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            {t('dashboard.training.notify_modal.submit')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
