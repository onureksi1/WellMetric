'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Send, 
  RefreshCw,
  Info,
  ChevronRight,
  Code,
  Languages,
  Loader2,
  X,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api/client';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function MailTemplateEditPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { t } = useTranslation('admin');
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'tr' | 'en'>('tr');
  
  // Form State
  const [formData, setFormData] = useState({
    subject_tr: '',
    subject_en: '',
    body_tr: '',
    body_en: ''
  });

  // Modal States
  const [showPreview, setShowPreview] = useState(false);
  const [showTest, setShowTest] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testLoading, setTestLoading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchTemplate();
  }, [slug]);

  const fetchTemplate = async () => {
    try {
      const response = await api.get(`/admin/mail-templates/${slug}`);
      setTemplate(response.data);
      setFormData({
        subject_tr: response.data.subject_tr || '',
        subject_en: response.data.subject_en || '',
        body_tr: response.data.body_tr || '',
        body_en: response.data.body_en || ''
      });
    } catch (error) {
      toast.error('Şablon yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaveLoading(true);
    try {
      await api.put(`/admin/mail-templates/${slug}`, formData);
      toast.success(t('mail_templates.edit.success'));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Kaydedilemedi');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm(t('mail_templates.edit.reset_confirm'))) return;
    try {
      await api.post(`/admin/mail-templates/${slug}/reset`);
      toast.success(t('mail_templates.edit.reset_success'));
      fetchTemplate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Sıfırlanamadı');
    }
  };

  const handleSendTest = async () => {
    if (!testEmail) return toast.error('E-posta adresi giriniz');
    setTestLoading(true);
    try {
      await api.post(`/admin/mail-templates/${slug}/test`, {
        to: testEmail,
        language: activeTab
      });
      toast.success(t('mail_templates.test.success'));
      setShowTest(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gönderilemedi');
    } finally {
      setTestLoading(false);
    }
  };

  const insertVariable = (variable: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = activeTab === 'tr' ? formData.body_tr : formData.body_en;
    const newText = text.substring(0, start) + variable + text.substring(end);

    setFormData({
      ...formData,
      [activeTab === 'tr' ? 'body_tr' : 'body_en']: newText
    });

    // Reset cursor position after React update
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <Loader2 className="animate-spin text-primary" size={48} />
      <p className="text-gray-500 font-medium">Editör yükleniyor...</p>
    </div>
  );

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen flex flex-col">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.push('/admin/mail-templates')}
            className="h-12 w-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-navy hover:border-primary hover:text-primary transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-extrabold text-navy tracking-tight uppercase">
                {template.slug.replace(/_/g, ' ')}
              </h1>
              <div className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20">
                MAIL TEMPLATE
              </div>
            </div>
            <p className="text-gray-500">{template.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowPreview(true)}
            className="h-12 px-6 rounded-xl flex gap-2 items-center"
          >
            <Eye size={18} />
            {t('mail_templates.edit.preview')}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowTest(true)}
            className="h-12 px-6 rounded-xl flex gap-2 items-center"
          >
            <Send size={18} />
            {t('mail_templates.test.send')}
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={saveLoading}
            className="h-12 px-8 rounded-xl premium-gradient text-white font-bold shadow-lg shadow-primary/20 flex gap-2 items-center"
          >
            {saveLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {t('mail_templates.edit.save')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 flex-1">
        {/* Main Editor Panel */}
        <div className="xl:col-span-3 space-y-6">
          {/* Tabs */}
          <div className="bg-slate-100 p-1.5 rounded-2xl inline-flex gap-1">
            <button
              onClick={() => setActiveTab('tr')}
              className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'tr' ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-navy'}`}
            >
              {t('mail_templates.edit.tabs.turkish')}
            </button>
            <button
              onClick={() => setActiveTab('en')}
              className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'en' ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-navy'}`}
            >
              {t('mail_templates.edit.tabs.english')}
            </button>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm flex flex-col h-[700px]">
            <div className="p-6 border-bottom border-slate-100 bg-slate-50/50">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                {t('mail_templates.edit.subject')}
              </label>
              <input
                type="text"
                value={activeTab === 'tr' ? formData.subject_tr : formData.subject_en}
                onChange={(e) => setFormData({
                  ...formData,
                  [activeTab === 'tr' ? 'subject_tr' : 'subject_en']: e.target.value
                })}
                placeholder="E-posta konusu..."
                className="w-full bg-transparent text-xl font-bold text-navy outline-none placeholder:text-slate-300"
              />
            </div>

            <div className="flex-1 relative">
              <div className="absolute top-4 right-6 flex items-center gap-2 text-[10px] font-bold text-slate-300 pointer-events-none uppercase tracking-widest">
                <Code size={12} />
                HTML CONTENT
              </div>
              <textarea
                ref={textareaRef}
                value={activeTab === 'tr' ? formData.body_tr : formData.body_en}
                onChange={(e) => setFormData({
                  ...formData,
                  [activeTab === 'tr' ? 'body_tr' : 'body_en']: e.target.value
                })}
                className="w-full h-full p-8 font-mono text-sm leading-relaxed text-slate-600 bg-white outline-none resize-none selection:bg-primary/10"
                spellCheck="false"
              />
            </div>
          </div>

          <div className="flex justify-start">
            <button
              onClick={handleReset}
              className="text-gray-400 hover:text-danger text-sm font-bold flex items-center gap-2 transition-colors px-4 py-2"
            >
              <RefreshCw size={14} />
              {t('mail_templates.edit.reset')}
            </button>
          </div>
        </div>

        {/* Sidebar Panel */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center">
                <Info size={20} />
              </div>
              <h3 className="font-bold text-navy">{t('mail_templates.edit.variables')}</h3>
            </div>
            
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              {t('mail_templates.edit.variables_hint')}
            </p>

            <div className="space-y-2">
              {template.variables.map((v: string) => (
                <button
                  key={v}
                  onClick={() => insertVariable(v)}
                  className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-primary/5 hover:border-primary/20 border border-slate-100 rounded-xl transition-all group"
                >
                  <code className="text-xs font-bold text-primary group-hover:scale-105 transition-transform">{v}</code>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-navy rounded-3xl p-8 text-white relative overflow-hidden group">
            <div className="relative z-10">
              <h4 className="font-bold text-lg mb-2">Editor İpucu</h4>
              <p className="text-navy-lighter text-sm leading-relaxed">
                Responsive yapıyı bozmamak için tablo yapılarını (table, tr, td) kullanmaya özen gösterin. CSS inline style olarak yazılmalıdır.
              </p>
            </div>
            <FileText className="absolute bottom-[-10px] right-[-10px] text-white/5 rotate-12 transition-transform group-hover:scale-110" size={120} />
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPreview(false)}
              className="absolute inset-0 bg-navy/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-4xl max-h-full rounded-[40px] shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                    <Eye size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-navy uppercase tracking-widest">{t('mail_templates.edit.preview')}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      {activeTab === 'tr' ? 'TURKISH VERSION' : 'ENGLISH VERSION'}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowPreview(false)} className="h-10 w-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 bg-slate-200 p-8 overflow-auto flex justify-center">
                <div className="bg-white w-[600px] shadow-xl min-h-[800px] p-0 rounded-2xl overflow-hidden border border-slate-300">
                  <iframe
                    title="Mail Preview"
                    srcDoc={activeTab === 'tr' ? formData.body_tr : formData.body_en}
                    className="w-full h-full border-none"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Test Mail Modal */}
      <AnimatePresence>
        {showTest && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTest(false)}
              className="absolute inset-0 bg-navy/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 text-center">
                <div className="h-20 w-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Send size={40} />
                </div>
                <h3 className="text-2xl font-black text-navy mb-2 uppercase tracking-tighter">{t('mail_templates.test.title')}</h3>
                <p className="text-slate-500 mb-8 px-4">
                  Şablonun görünümünü doğrulamak için bir test e-postası gönderin.
                </p>
                
                <div className="space-y-4 text-left mb-10">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">E-POSTA ADRESİ</label>
                    <input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="isim@sirket.com"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold text-navy"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">TEST DİLİ</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setActiveTab('tr')}
                        className={`py-3 rounded-xl text-sm font-bold border transition-all ${activeTab === 'tr' ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white text-slate-400 border-slate-100 hover:border-primary/20'}`}
                      >
                        TÜRKÇE
                      </button>
                      <button
                        onClick={() => setActiveTab('en')}
                        className={`py-3 rounded-xl text-sm font-bold border transition-all ${activeTab === 'en' ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white text-slate-400 border-slate-100 hover:border-primary/20'}`}
                      >
                        İNGİLİZCE
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowTest(false)}
                    className="flex-1 h-14 rounded-2xl"
                  >
                    İptal
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSendTest}
                    disabled={testLoading}
                    className="flex-1 h-14 rounded-2xl premium-gradient text-white font-bold shadow-xl shadow-primary/20 flex gap-2 items-center justify-center"
                  >
                    {testLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                    Gönder
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
