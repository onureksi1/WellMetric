'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Save, Eye, Edit3, ChevronLeft, Loader2, Sparkles, Plus, Download } from 'lucide-react';
import { useT } from '@/hooks/useT';
import client from '@/lib/api/client';
import { useAuthStore } from '@/lib/store/auth.store';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ReportEditorProps {
  reportId?: string;
}

export default function ReportEditor({ reportId }: ReportEditorProps) {
  const router = useRouter();
  const { t } = useT('consultant');
  const [form, setForm] = useState({
    title: '',
    company_id: '',
    period: new Date().toISOString().slice(0, 7),
    summary: '',
    content: '',
    tags: [] as string[],
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!reportId);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [preview, setPreview] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [showInsightPicker, setShowInsightPicker] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companiesRes] = await Promise.all([
          client.get('/consultant/companies'),
        ]);
        setCompanies(Array.isArray(companiesRes.data) ? companiesRes.data : (companiesRes.data.data || []));

        if (reportId) {
          const reportRes = await client.get(`/consultant/reports/${reportId}`);
          const r = reportRes.data;
          setForm({
            title: r.title,
            company_id: r.companyId,
            period: r.period || '',
            summary: r.summary || '',
            content: r.content,
            tags: r.tags || [],
          });
        }
      } catch (error) {
        toast.error(t('reports.editor.load_error'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [reportId]);

  // AI Insight'ları yükle (Seçilen firmaya göre)
  useEffect(() => {
    if (form.company_id) {
      client.get(`/ai/insights?company_id=${form.company_id}`)
        .then(res => setInsights(res.data || []))
        .catch(() => {});
    }
  }, [form.company_id]);

  const handleSave = async () => {
    if (!form.title || !form.company_id || !form.content) {
      toast.error(t('reports.editor.validation_error'));
      return;
    }
    setSaving(true);
    try {
      if (reportId) {
        await client.put(`/consultant/reports/${reportId}`, form);
      } else {
        await client.post('/consultant/reports', form);
      }
      toast.success(t('reports.editor.save_success'));
      router.push('/consultant/reports');
    } catch (error) {
      toast.error(t('reports.editor.save_error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!reportId) return;
    try {
      setDownloadingPdf(true);
      const { accessToken } = useAuthStore.getState();

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/consultant/reports/${reportId}/pdf`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!res.ok) {
        toast.error('PDF indirilemedi');
        return;
      }

      const blob     = await res.blob();
      const url      = URL.createObjectURL(blob);
      const a        = document.createElement('a');
      a.href         = url;
      a.download     = `wellbeing-raporu-${reportId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('PDF indirildi');
    } catch {
      toast.error('Bağlantı hatası');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const insertInsight = (insight: any) => {
    const md = `\n\n### AI Analizi: ${insight.insight_type}\n${insight.content}\n\n`;
    setForm(f => ({ ...f, content: f.content + md }));
    setShowInsightPicker(false);
    toast.success(t('reports.editor.insight_added'));
  };

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 bg-slate-50/80 backdrop-blur-md py-4 z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-200 rounded-full transition-all">
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-xl font-bold text-slate-900">
            {reportId ? t('reports.editor.edit_title') : t('reports.editor.new_title')}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPreview(!preview)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            {preview ? <><Edit3 size={18} /> {t('reports.editor.edit')}</> : <><Eye size={18} /> {t('reports.editor.preview')}</>}
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={!reportId || saving || downloadingPdf}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-all disabled:opacity-30"
          >
            {downloadingPdf ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            {t('reports.editor.download_pdf')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {t('reports.editor.save_draft')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">{t('reports.editor.report_title_label')}</label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder={t('reports.editor.report_title_placeholder')}
                className="w-full text-lg font-bold text-slate-900 border-none bg-slate-50 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
            </div>

            {preview ? (
              <div style={{
                padding: '1.5rem',
                border: '0.5px solid var(--color-border-secondary)',
                borderRadius: 'var(--border-radius-md)',
                minHeight: 400,
                background: 'var(--color-background-primary)',
                lineHeight: 1.8,
                fontSize: 14,
              }}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({children}) => (
                      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0F6E56', margin: '24px 0 12px', borderBottom: '2px solid #E5F5EF', paddingBottom: 8 }}>{children}</h1>
                    ),
                    h2: ({children}) => (
                      <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1D9E75', margin: '20px 0 10px' }}>{children}</h2>
                    ),
                    h3: ({children}) => (
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1D1D1B', margin: '16px 0 8px' }}>{children}</h3>
                    ),
                    p: ({children}) => (
                      <p style={{ marginBottom: 12, lineHeight: 1.6, color: '#444', textAlign: 'justify' }}>{children}</p>
                    ),
                    ul: ({children}) => (
                      <ul style={{ paddingLeft: 20, marginBottom: 12, color: '#444' }}>{children}</ul>
                    ),
                    ol: ({children}) => (
                      <ol style={{ paddingLeft: 20, marginBottom: 12, color: '#444' }}>{children}</ol>
                    ),
                    li: ({children}) => (
                      <li style={{ marginBottom: 4 }}>{children}</li>
                    ),
                    strong: ({children}) => (
                      <strong style={{ fontWeight: 600, color: '#1D1D1B' }}>{children}</strong>
                    ),
                    blockquote: ({children}) => (
                      <blockquote style={{
                        borderLeft: '4px solid #1D9E75',
                        background: '#F8FFFE',
                        padding: '12px 20px',
                        margin: '16px 0',
                        color: '#666',
                        fontStyle: 'italic',
                        borderRadius: '0 8px 8px 0',
                      }}>{children}</blockquote>
                    ),
                    code: ({inline, children}: any) => inline ? (
                      <code style={{
                        background: '#F1F5F9',
                        padding: '2px 6px', borderRadius: 4,
                        fontFamily: 'monospace', fontSize: '0.9em',
                        color: '#E11D48',
                      }}>{children}</code>
                    ) : (
                      <pre style={{
                        background: '#1E293B',
                        padding: 16, borderRadius: 12,
                        fontFamily: 'monospace', fontSize: 13,
                        color: '#F8FAFC',
                        overflowX: 'auto', margin: '16px 0',
                      }}><code>{children}</code></pre>
                    ),
                    table: ({children}) => (
                      <div style={{ overflowX: 'auto', margin: '16px 0' }}>
                        <table style={{
                          width: '100%', borderCollapse: 'collapse',
                          fontSize: 13,
                        }}>{children}</table>
                      </div>
                    ),
                    th: ({children}) => (
                      <th style={{
                        padding: '10px 14px', textAlign: 'left',
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        fontWeight: 600,
                        color: '#475569',
                      }}>{children}</th>
                    ),
                    td: ({children}) => (
                      <td style={{
                        padding: '10px 14px',
                        border: '1px solid #E2E8F0',
                        color: '#64748B',
                      }}>{children}</td>
                    ),
                    hr: () => (
                      <hr style={{
                        border: 'none',
                        borderTop: '1px solid #E5F5EF',
                        margin: '24px 0',
                      }} />
                    ),
                  }}
                >
                  {form.content || '*İçerik yok...*'}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('reports.editor.report_content_label')}</label>
                  <button 
                    onClick={() => setShowInsightPicker(!showInsightPicker)}
                    disabled={!form.company_id}
                    className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 disabled:opacity-30"
                  >
                    <Sparkles size={14} />
                    {t('reports.editor.add_ai_analysis')}
                  </button>
                </div>
                {showInsightPicker && (
                  <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100 animate-in fade-in slide-in-from-top-2">
                    <h4 className="text-xs font-bold text-indigo-700 mb-3 flex items-center gap-2">
                      <Sparkles size={12} /> {t('reports.editor.available_ai_insights')}
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {insights.map(i => (
                        <button
                          key={i.id}
                          onClick={() => insertInsight(i)}
                          className="text-left bg-white p-3 rounded-xl border border-indigo-200 hover:border-indigo-400 transition-all group"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-700">{i.insight_type}</span>
                            <Plus size={14} className="text-indigo-400 group-hover:text-indigo-600" />
                          </div>
                          <p className="text-[10px] text-slate-500 line-clamp-1 mt-1">{i.content}</p>
                        </button>
                      ))}
                      {insights.length === 0 && <p className="text-[10px] text-indigo-400 italic">{t('reports.editor.no_ai_insights')}</p>}
                    </div>
                  </div>
                )}
                <textarea
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="## Giriş&#10;Bu rapor..."
                  rows={20}
                  className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-slate-700 font-mono text-sm leading-relaxed focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-4">{t('reports.editor.settings_title')}</h3>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t('reports.editor.company_selection')}</label>
              <select
                value={form.company_id}
                onChange={e => setForm(f => ({ ...f, company_id: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/10"
              >
                <option value="">{t('reports.editor.select_company_placeholder')}</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t('reports.editor.report_period')}</label>
              <input
                type="month"
                value={form.period}
                onChange={e => setForm(f => ({ ...f, period: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t('reports.editor.summary_label')}</label>
              <textarea
                value={form.summary}
                onChange={e => setForm(f => ({ ...f, summary: e.target.value.slice(0, 300) }))}
                placeholder={t('reports.editor.summary_placeholder')}
                rows={4}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none resize-none"
              />
              <div className="text-[10px] text-right text-slate-400">{form.summary.length}/300</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
