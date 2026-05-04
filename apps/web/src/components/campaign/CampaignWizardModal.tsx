'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Send, 
  Users, 
  FileText, 
  Calendar, 
  CheckCircle2,
  Upload,
  Clock,
  ArrowRight,
  Loader2,
  Info,
  Building2
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import toast from 'react-hot-toast';

import client from '@/lib/api/client';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: {
    survey_id?: string;
    assignment_id?: string;
    period?: string;
  };
}

export function CampaignWizardModal({ isOpen, onClose, onSuccess, initialData }: Props) {
  const [step, setStep] = useState(initialData?.survey_id ? 2 : 1);
  const [formData, setFormData] = useState<any>({
    survey_id: initialData?.survey_id || '',
    assignment_id: initialData?.assignment_id || '',
    period: initialData?.period || '',
    recipient_mode: 'existing', // existing | department | csv
    department_id: '',
    scheduled_mode: 'now', // now | scheduled
    scheduled_at: '',
  });

  const { data: surveys, isLoading: isLoadingSurveys } = useQuery({
    queryKey: ['hr-surveys'],
    queryFn: async () => {
      const { data } = await client.get('/hr/surveys');
      return data;
    },
    enabled: isOpen
  });

  // Gerçek çalışan sayısını çek
  const { data: employeeCountData } = useQuery({
    queryKey: ['hr-employee-count'],
    queryFn: async () => {
      const { data } = await client.get('/hr/employees?per_page=1');
      return data?.meta?.total ?? data?.total ?? null;
    },
    enabled: isOpen
  });
  const employeeCount = employeeCountData != null ? `${employeeCountData} Çalışan` : 'Yükleniyor...';

  // Departmanları çek
  const { data: departments = [] } = useQuery({
    queryKey: ['hr-departments-wizard'],
    queryFn: async () => {
      const { data } = await client.get('/hr/departments');
      return Array.isArray(data) ? data : [];
    },
    enabled: isOpen
  });

  const selectedDept = departments.find((d: any) => d.id === formData.department_id);
  const recipientLabel = formData.recipient_mode === 'department'
    ? (selectedDept ? `${selectedDept.name} departmanı` : 'Departman seçilmedi')
    : employeeCount;

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await client.post('/hr/campaigns', {
        survey_id: data.survey_id,
        assignment_id: data.assignment_id || undefined,
        period: data.period || undefined,
        scheduled_at: data.scheduled_mode === 'scheduled' ? data.scheduled_at : null,
        employee_accounts: false,
        ...(data.recipient_mode === 'department' && data.department_id
          ? { department_id: data.department_id }
          : {}),
      });
    },
    onSuccess: () => {
      toast.success('Kampanya başarıyla oluşturuldu.');
      onSuccess();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Kampanya oluşturulurken bir hata oluştu.');
    }
  });

  const steps = [
    { id: 1, title: 'Anket Seç', icon: <FileText size={18} /> },
    { id: 2, title: 'Alıcılar', icon: <Users size={18} /> },
    { id: 3, title: 'Zamanlama', icon: <Calendar size={18} /> },
  ];

  const handleNext = () => {
    if (step === 1 && !formData.survey_id) return toast.error('Lütfen bir anket seçin.');
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const selectedSurvey = surveys?.find((s: any) => s.id === formData.survey_id);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Yeni Dağıtım Kampanyası" maxWidth="lg">
      <div className="flex flex-col h-[600px]">
        {/* Step Indicator */}
        <div className="flex items-center justify-between px-8 py-6 bg-gray-50 border-b border-gray-100">
           {steps.map((s, idx) => (
             <React.Fragment key={s.id}>
               <div className={`flex items-center gap-3 ${step >= s.id ? 'text-primary' : 'text-gray-400'}`}>
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm border-2 transition-all ${step >= s.id ? 'bg-primary/10 border-primary shadow-sm' : 'bg-white border-gray-200'}`}>
                    {step > s.id ? <CheckCircle2 size={16} /> : s.id}
                 </div>
                 <span className="text-xs font-black uppercase tracking-widest">{s.title}</span>
               </div>
               {idx < steps.length - 1 && (
                 <div className={`flex-1 h-0.5 mx-4 rounded-full ${step > s.id ? 'bg-primary' : 'bg-gray-200'}`} />
               )}
             </React.Fragment>
           ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
           {step === 1 && (
             <div className="space-y-4">
               <h3 className="text-lg font-black text-navy">Dağıtılacak Anketi Seçin</h3>
               {isLoadingSurveys ? (
                 <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
               ) : (
                 <div className="grid gap-3">
                   {surveys?.map((survey: any) => (
                     <label 
                       key={survey.id}
                       className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${formData.survey_id === survey.id ? 'bg-primary/5 border-primary' : 'bg-white border-gray-100 hover:border-gray-200'}`}
                     >
                        <div className="flex items-center gap-4">
                          <input 
                            type="radio" 
                            name="survey" 
                            className="w-5 h-5 text-primary focus:ring-primary"
                            checked={formData.survey_id === survey.id}
                            onChange={() => setFormData({ ...formData, survey_id: survey.id })}
                          />
                          <div>
                            <p className="font-bold text-navy">{survey.title || survey.title_tr || 'İsimsiz Anket'}</p>
                            <p className="text-xs text-gray-400">Dönem: {survey.period} • Son Tarih: {survey.due_at ? format(new Date(survey.due_at), 'dd MMM yyyy', { locale: tr }) : '-'}</p>
                          </div>
                        </div>
                        <Badge variant={survey.type === 'global' ? 'gray' : 'blue'}>
                          {survey.type === 'global' ? 'Global' : 'Özel'}
                        </Badge>
                     </label>
                   ))}
                 </div>
               )}
             </div>
           )}

           {step === 2 && (
             <div className="space-y-6">
                <h3 className="text-lg font-black text-navy">Alıcı Listesi Belirleyin</h3>
                
                <div className="grid gap-3">
                   {/* Tüm Şirket */}
                   <button 
                     onClick={() => setFormData({ ...formData, recipient_mode: 'existing', department_id: '' })}
                     className={`flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all ${formData.recipient_mode === 'existing' ? 'bg-primary/5 border-primary shadow-sm' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
                   >
                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${formData.recipient_mode === 'existing' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                        <Users size={20} />
                     </div>
                     <div className="flex-1">
                        <p className="font-bold text-navy">Tüm Şirket</p>
                        <p className="text-sm text-gray-500 mt-1">Sisteme kayıtlı tüm aktif çalışanlara gönderilir.</p>
                        <Badge className="mt-3">{employeeCount}</Badge>
                     </div>
                   </button>

                   {/* Departmana Göre */}
                   <button 
                     onClick={() => setFormData({ ...formData, recipient_mode: 'department' })}
                     className={`flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all ${formData.recipient_mode === 'department' ? 'bg-indigo-50 border-indigo-400 shadow-sm' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
                   >
                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${formData.recipient_mode === 'department' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                        <Building2 size={20} />
                     </div>
                     <div className="flex-1">
                        <p className="font-bold text-navy">Departmana Göre</p>
                        <p className="text-sm text-gray-500 mt-1">Seçilen departmandaki aktif çalışanlara gönderilir.</p>
                        {formData.recipient_mode === 'department' && (
                          <select
                            className="mt-3 w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-sm font-bold text-navy outline-none focus:ring-2 focus:ring-indigo-300"
                            value={formData.department_id}
                            onClick={e => e.stopPropagation()}
                            onChange={e => setFormData({ ...formData, department_id: e.target.value })}
                          >
                            <option value="">-- Departman seçin --</option>
                            {departments.map((d: any) => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                        )}
                     </div>
                   </button>
                </div>

                <div className="p-4 bg-blue-50 rounded-2xl flex gap-3 border border-blue-100">
                   <Info className="text-blue-500 flex-shrink-0" size={20} />
                   <p className="text-sm text-blue-700 font-medium leading-relaxed">
                      Anket linkleri kişiye özel üretilecek ve her çalışanın kendi e-posta adresine gönderilecektir. Yanıtlar anonim olarak işlenir.
                   </p>
                </div>
             </div>
           )}

           {step === 3 && (
             <div className="space-y-8">
                <div className="space-y-4">
                   <h3 className="text-lg font-black text-navy">Gönderim Zamanı</h3>
                   <div className="flex gap-4">
                      <button 
                        onClick={() => setFormData({ ...formData, scheduled_mode: 'now' })}
                        className={`flex-1 p-5 rounded-2xl border-2 text-center transition-all ${formData.scheduled_mode === 'now' ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white border-gray-100 text-gray-500'}`}
                      >
                         <Send size={24} className="mx-auto mb-2" />
                         <p className="font-black">Hemen Gönder</p>
                      </button>
                      <button 
                        onClick={() => setFormData({ ...formData, scheduled_mode: 'scheduled' })}
                        className={`flex-1 p-5 rounded-2xl border-2 text-center transition-all ${formData.scheduled_mode === 'scheduled' ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white border-gray-100 text-gray-500'}`}
                      >
                         <Calendar size={24} className="mx-auto mb-2" />
                         <p className="font-black">Zamanla</p>
                      </button>
                   </div>

                   {formData.scheduled_mode === 'scheduled' && (
                     <div className="p-4 bg-gray-50 rounded-2xl animate-in fade-in slide-in-from-top-2">
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Zaman Seçin</label>
                        <input 
                          type="datetime-local" 
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 font-bold text-navy outline-none focus:ring-2 focus:ring-primary"
                          value={formData.scheduled_at}
                          onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                        />
                     </div>
                   )}
                </div>

                <div className="bg-navy p-6 rounded-3xl text-white space-y-4 shadow-xl">
                   <div className="flex justify-between items-center border-b border-white/10 pb-4">
                      <span className="text-sm font-bold opacity-60">Özet</span>
                      <Badge variant="gray">Anket Dağıtımı</Badge>
                   </div>
                   <div className="space-y-3">
                      <div className="flex justify-between">
                         <span className="text-sm opacity-60">Anket:</span>
                         <span className="text-sm font-black">{selectedSurvey?.title}</span>
                      </div>
                      <div className="flex justify-between">
                         <span className="text-sm opacity-60">Alıcı:</span>
                         <span className="text-sm font-black">{recipientLabel}</span>
                      </div>
                      <div className="flex justify-between">
                         <span className="text-sm opacity-60">Zamanlama:</span>
                         <span className="text-sm font-black">{formData.scheduled_mode === 'now' ? 'Anında' : formData.scheduled_at || 'Tarih seçilmedi'}</span>
                      </div>
                   </div>
                </div>
             </div>
           )}
        </div>

        {/* Actions */}
        <div className="px-8 py-6 bg-white border-t border-gray-100 flex justify-between">
           <Button variant="ghost" onClick={step === 1 ? onClose : handleBack} className="gap-2">
             {step === 1 ? <X size={18} /> : <ChevronLeft size={18} />}
             {step === 1 ? 'İptal' : 'Geri'}
           </Button>
           <Button 
             onClick={step === 3 ? () => createMutation.mutate(formData) : handleNext} 
             className="gap-2 min-w-[140px]"
             disabled={createMutation.isPending}
           >
             {createMutation.isPending ? (
               <Loader2 size={18} className="animate-spin" />
             ) : (
               <>
                 {step === 3 ? (formData.scheduled_mode === 'now' ? 'Dağıtımı Başlat' : 'Zamanla') : 'İleri'}
                 {step < 3 && <ArrowRight size={18} />}
                 {step === 3 && <Send size={18} />}
               </>
             )}
           </Button>
        </div>
      </div>
    </Modal>
  );
}
