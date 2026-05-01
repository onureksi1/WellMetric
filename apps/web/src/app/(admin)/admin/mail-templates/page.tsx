'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Mail, 
  Search, 
  Edit3, 
  Send, 
  Clock, 
  ChevronRight,
  Globe,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api/client';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function MailTemplatesPage() {
  const { t } = useTranslation('admin');
  const router = useRouter();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/admin/mail-templates');
      setTemplates(response.data);
    } catch (error) {
      toast.error(t('mail_templates.load_error'));
    } finally {
      setLoading(false);
    }

  };

  const filteredTemplates = templates.filter(template => 
    template.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-navy tracking-tight mb-2">
            {t('mail_templates.title')}
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl">
            {t('mail_templates.subtitle')}
          </p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder={t('mail_templates.search_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm outline-none"
          />
        </div>

      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="animate-spin text-primary" size={48} />
          <p className="text-gray-500 animate-pulse font-medium">{t('mail_templates.loading')}</p>
        </div>

      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredTemplates.map((template, index) => (
              <motion.div
                key={template.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="group relative bg-white border border-slate-100 rounded-3xl p-6 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden"
              >
                {/* Background Decor */}
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
                  <Mail size={120} className="rotate-12" />
                </div>

                <div className="flex items-start gap-4 mb-6 relative">
                  <div className="h-14 w-14 bg-primary/5 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500">
                    <Mail size={28} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-navy mb-1 group-hover:text-primary transition-colors">
                      {template.slug.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </h3>
                    <p className="text-gray-500 text-sm line-clamp-1">{template.description}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full border border-emerald-100 uppercase tracking-wider">TR</div>
                    <div className={`px-2.5 py-1 ${template.subject_en ? 'bg-sky-50 text-sky-600 border-sky-100' : 'bg-slate-50 text-slate-400 border-slate-100'} text-[10px] font-bold rounded-full border uppercase tracking-wider`}>EN</div>
                  </div>
                </div>

                <div className="space-y-4 mb-8 relative">
                  <div className="flex items-center gap-3 text-sm text-gray-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                    <div className="flex -space-x-2">
                      {template.variables.slice(0, 3).map((v: string) => (
                        <div key={v} className="h-6 px-2 bg-white border border-slate-200 rounded-md text-[10px] font-mono flex items-center shadow-sm">
                          {v}
                        </div>
                      ))}
                      {template.variables.length > 3 && (
                        <div className="h-6 px-2 bg-slate-200 rounded-md text-[10px] font-bold flex items-center">+ {template.variables.length - 3}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 italic">
                    <Clock size={14} />
                    {t('mail_templates.list.updated')}: {new Date(template.updated_at).toLocaleDateString(t('common:date_locale'))}
                  </div>

                </div>

                <div className="flex gap-3 relative">
                  <Button
                    variant="primary"
                    onClick={() => router.push(`/admin/mail-templates/${template.slug}`)}
                    className="flex-1 premium-gradient text-white h-12 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-primary/20"
                  >
                    <Edit3 size={18} />
                    {t('mail_templates.list.edit')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/admin/mail-templates/${template.slug}?test=true`)}
                    className="flex-1 h-12 rounded-xl flex items-center justify-center gap-2 font-bold transition-all"
                  >
                    <Send size={18} />
                    {t('mail_templates.list.test')}
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
