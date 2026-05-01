'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useApi } from '@/hooks/useApi';
import { toast } from 'react-hot-toast';
import { Calendar, Building, MapPin, CheckCircle, ClipboardList } from 'lucide-react';

interface AssignSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  surveyId?: string;
  surveyTitle?: string;
  initialCompanyId?: string;
  onSuccess?: () => void;
}

export const AssignSurveyModal: React.FC<AssignSurveyModalProps> = ({
  isOpen,
  onClose,
  surveyId: initialSurveyId,
  surveyTitle: initialSurveyTitle,
  initialCompanyId,
  onSuccess
}) => {
  const [surveyId, setSurveyId] = useState<string>(initialSurveyId || '');
  const [surveyTitle, setSurveyTitle] = useState<string>(initialSurveyTitle || '');
  const [assignmentType, setAssignmentType] = useState<'all' | 'specific'>(initialCompanyId ? 'specific' : 'all');
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>(initialCompanyId ? [initialCompanyId] : []);
  const [departmentId, setDepartmentId] = useState<string>('');
  const [period, setPeriod] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [dueAt, setDueAt] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7); // Default to 7 days from now
    return d.toISOString().slice(0, 10);
  });
  const [validityType, setValidityType] = useState<'7' | '14' | '30' | 'custom'>('7');

  const { data: surveysData } = useApi<any>('/admin/surveys');
  const { data: companies, loading: loadingCompanies } = useApi<any[]>('/admin/companies');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialSurveyId) setSurveyId(initialSurveyId);
    if (initialSurveyTitle) setSurveyTitle(initialSurveyTitle);
  }, [initialSurveyId, initialSurveyTitle]);

  const handleSubmit = async () => {
    if (!surveyId) {
      toast.error('Lütfen bir anket seçin.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        company_ids: assignmentType === 'all' ? null : selectedCompanies,
        department_id: departmentId || undefined,
        period,
        due_at: dueAt
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/surveys/${surveyId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`${result.assigned_count} firmaya atandı. ${result.skipped_count} firma zaten atanmıştı.`);
        onSuccess?.();
        onClose();
      } else {
        toast.error(result.message || 'Atama başarısız.');
      }
    } catch (error) {
      toast.error('Bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedSurveyFromList = surveysData?.data?.find((s: any) => s.id === surveyId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Anketi Firmaya Ata" size="lg">
      <div className="space-y-6">
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">Seçili Anket</label>
          {initialSurveyId ? (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 font-medium text-navy flex items-center gap-2">
              <ClipboardList size={18} className="text-primary" />
              {surveyTitle}
            </div>
          ) : (
            <select
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              value={surveyId}
              onChange={(e) => {
                setSurveyId(e.target.value);
                const s = surveysData?.data?.find((s: any) => s.id === e.target.value);
                if (s) setSurveyTitle(s.title_tr);
              }}
            >
              <option value="">Anket Seçin...</option>
              {surveysData?.data?.filter((s: any) => s.type !== 'global').map((s: any) => (
                <option key={s.id} value={s.id}>{s.title_tr}</option>
              ))}
            </select>
          )}
        </div>

        <div className="space-y-3">
          <label className="text-xs font-semibold text-gray-400 uppercase block">Firma Seçimi</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setAssignmentType('all')}
              className={`p-4 rounded-xl border-2 transition-all text-left flex flex-col gap-2 ${
                assignmentType === 'all' 
                  ? 'border-primary bg-primary/5 text-primary' 
                  : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
              }`}
            >
              <CheckCircle size={20} className={assignmentType === 'all' ? 'text-primary' : 'text-gray-300'} />
              <span className="font-bold">Tüm Aktif Firmalar</span>
              <span className="text-[10px] opacity-70">Platformdaki tüm aktif şirketlere atanır.</span>
            </button>
            <button
              onClick={() => setAssignmentType('specific')}
              className={`p-4 rounded-xl border-2 transition-all text-left flex flex-col gap-2 ${
                assignmentType === 'specific' 
                  ? 'border-primary bg-primary/5 text-primary' 
                  : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
              }`}
            >
              <Building size={20} className={assignmentType === 'specific' ? 'text-primary' : 'text-gray-300'} />
              <span className="font-bold">Belirli Firmalar</span>
              <span className="text-[10px] opacity-70">Sadece seçtiğiniz şirketlere atanır.</span>
            </button>
          </div>
        </div>

        {assignmentType === 'specific' && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">Şirketleri Seçin</label>
            <select
              multiple
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 min-h-[120px]"
              value={selectedCompanies}
              onChange={(e) => {
                const options = Array.from(e.target.selectedOptions, option => option.value);
                setSelectedCompanies(options);
              }}
            >
              {loadingCompanies ? (
                <option disabled>Yükleniyor...</option>
              ) : (
                (companies as any)?.data?.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))
              )}

            </select>
            <p className="text-[10px] text-gray-400 mt-1 italic">Birden fazla seçmek için CMD/Ctrl tuşuna basılı tutun.</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">Dönem (YYYY-MM)</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="month"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">Link Geçerlilik Süresi</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {[
                { label: '7 Gün', value: '7' },
                { label: '14 Gün', value: '14' },
                { label: '30 Gün', value: '30' },
                { label: 'Özel', value: 'custom' },
              ].map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => {
                    setValidityType(t.value as any);
                    if (t.value !== 'custom') {
                      const d = new Date();
                      d.setDate(d.getDate() + parseInt(t.value));
                      setDueAt(d.toISOString().slice(0, 10));
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    validityType === t.value 
                      ? 'bg-primary border-primary text-white shadow-sm' 
                      : 'bg-white border-gray-200 text-gray-500 hover:border-primary/50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            
            {validityType === 'custom' && (
              <div className="relative animate-in fade-in duration-200">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="date"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                />
              </div>
            )}

            {validityType !== 'custom' && (
              <div className="text-xs font-medium text-gray-400">
                Anket <b>{new Date(dueAt).toLocaleDateString('tr-TR')}</b> tarihine kadar açık kalacak.
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
          <div className="flex gap-3 text-primary text-sm">
            <CheckCircle size={20} className="shrink-0" />
            <div className="space-y-1">
               <p>
                  <b>{assignmentType === 'all' ? 'Tüm aktif' : `${selectedCompanies.length}`}</b> firmaya, 
                  <b> {period}</b> dönemi için atama yapılacak.
               </p>
               {surveyId && (
                 <p className="text-[10px] opacity-70">Seçili Anket: {surveyTitle}</p>
               )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose}>İptal</Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>Ata</Button>
        </div>
      </div>
    </Modal>
  );
};
