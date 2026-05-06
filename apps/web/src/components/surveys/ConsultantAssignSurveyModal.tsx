'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useApi } from '@/hooks/useApi';
import { toast } from 'react-hot-toast';
import { Calendar, Building, ClipboardList, Loader2 } from 'lucide-react';
import client from '@/lib/api/client';

interface ConsultantAssignSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  surveyId?: string;
  surveyTitle?: string;
  onSuccess?: () => void;
}

export const ConsultantAssignSurveyModal: React.FC<ConsultantAssignSurveyModalProps> = ({
  isOpen,
  onClose,
  surveyId: initialSurveyId,
  surveyTitle: initialSurveyTitle,
  onSuccess
}) => {
  const [surveyId, setSurveyId] = useState<string>(initialSurveyId || '');
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [period, setPeriod] = useState<string>(() => {
    const now = new Date();
    const q = Math.floor(now.getMonth() / 3) + 1;
    return `${now.getFullYear()}-Q${q}`;
  });
  const [dueAt, setDueAt] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });

  const { data: surveysData, loading: loadingSurveys } = useApi<any>('/consultant/surveys');
  const { data: companiesData, loading: loadingCompanies } = useApi<any>('/consultant/companies');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialSurveyId) setSurveyId(initialSurveyId);
  }, [initialSurveyId]);

  const handleSubmit = async () => {
    if (!surveyId || selectedCompanies.length === 0) {
      toast.error('Lütfen anket ve en az bir firma seçin.');
      return;
    }

    setIsSubmitting(true);
    try {
      await client.post('/consultant/surveys/assign', {
        survey_id: surveyId,
        company_ids: selectedCompanies,
        period,
        due_at: new Date(dueAt).toISOString()
      });
      
      toast.success('Anket başarıyla atandı!');
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error('Atama sırasında bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const companies = companiesData?.data || [];
  const surveys = surveysData || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Anket Ata" size="lg">
      <div className="space-y-6">
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">Anket Seçin</label>
          <select
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            value={surveyId}
            onChange={(e) => setSurveyId(e.target.value)}
          >
            <option value="">Anket Seçin...</option>
            {surveys.map((s: any) => (
              <option key={s.id} value={s.id}>{s.title_tr}</option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-gray-400 uppercase block">Firmalar</label>
            <button 
              onClick={() => setSelectedCompanies(companies.map((c: any) => c.id))}
              className="text-[10px] text-blue-600 font-bold hover:underline"
            >
              Tümünü Seç
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {loadingCompanies ? (
              <div className="col-span-2 py-4 flex justify-center"><Loader2 className="animate-spin text-slate-300" /></div>
            ) : companies.length > 0 ? (
              companies.map((company: any) => (
                <button
                  key={company.id}
                  onClick={() => {
                    setSelectedCompanies(prev => 
                      prev.includes(company.id) ? prev.filter(id => id !== company.id) : [...prev, company.id]
                    );
                  }}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                    selectedCompanies.includes(company.id)
                      ? 'border-blue-600 bg-blue-50 text-blue-900'
                      : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200'
                  }`}
                >
                  <Building size={16} className={selectedCompanies.includes(company.id) ? 'text-blue-600' : 'text-slate-300'} />
                  <span className="text-xs font-bold truncate">{company.name}</span>
                </button>
              ))
            ) : (
              <p className="col-span-2 text-center text-slate-400 text-xs italic py-4">Firma bulunamadı.</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">Dönem</label>
            <select
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              {[2025, 2026].map(year => (
                ['Q1', 'Q2', 'Q3', 'Q4'].map(q => (
                  <option key={`${year}-${q}`} value={`${year}-${q}`}>
                    {year} {q === 'Q1' ? '1.' : q === 'Q2' ? '2.' : q === 'Q3' ? '3.' : '4.'} Çeyrek
                  </option>
                ))
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">Son Tarih</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="date"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="ghost" onClick={onClose}>İptal</Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting} disabled={!surveyId || selectedCompanies.length === 0}>
            Atamayı Başlat
          </Button>
        </div>
      </div>
    </Modal>
  );
};
