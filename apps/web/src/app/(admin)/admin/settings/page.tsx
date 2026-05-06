'use client';

import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import axios from 'axios';
import { 
  Settings as SettingsIcon, 
  Bot, 
  Mail, 
  HardDrive,
  Save,
  ShieldCheck,
  RefreshCcw,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronRight,
  Info,
  Plus,
  CreditCard
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import client from '@/lib/api/client';

const PROVIDERS = [
  { id: 'anthropic', name: 'Anthropic', icon: '/images/providers/anthropic.svg' },
  { id: 'openai', name: 'OpenAI', icon: '/images/providers/openai.svg' },
  { id: 'azure_openai', name: 'Azure OpenAI', icon: '/images/providers/azure.svg' },
  { id: 'aws_bedrock', name: 'AWS Bedrock', icon: '/images/providers/aws.svg' },
  { id: 'huggingface', name: 'Hugging Face', icon: '/images/providers/huggingface.svg' },
  { id: 'ollama', name: 'Ollama (Local)', icon: '/images/providers/ollama.svg' }
];

const MODELS: Record<string, { id: string, name: string }[]> = {
  anthropic: [
    { id: 'claude-opus-4-7', name: 'Claude Opus 4.7' },
    { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6' },
    { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5 (Hızlı & Ucuz)' },
  ],
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Flash)' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
    { id: 'o1-preview', name: 'o1 Preview' }
  ],
  aws_bedrock: [
    { id: 'anthropic.claude-sonnet-4-6-v1:0', name: 'Claude 4.6 Sonnet (AWS)' },
    { id: 'meta.llama3-1-70b-instruct-v1:0', name: 'Llama 3.1 70B (AWS)' }
  ],
  huggingface: [
    { id: 'meta-llama/Llama-3.1-8B-Instruct', name: 'Llama 3.1 8B' },
    { id: 'mistralai/Mistral-7B-Instruct-v0.3', name: 'Mistral 7B' }
  ]
};

export default function SettingsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const [activeTab, setActiveTab] = useState('general');

  const TASKS = [
    { id: 'open_text_summary', label: t('admin.settings.ai.task_names.open_text_summary') },
    { id: 'risk_alert', label: t('admin.settings.ai.task_names.risk_alert') },
    { id: 'action_suggestion', label: t('admin.settings.ai.task_names.action_suggestion') },
    { id: 'trend_analysis', label: t('admin.settings.ai.task_names.trend_analysis') },
    { id: 'hr_chat', label: t('admin.settings.ai.task_names.hr_chat') },
    { id: 'admin_anomaly', label: t('admin.settings.ai.task_names.admin_anomaly') },
    { id: 'admin_chat', label: t('admin.settings.ai.task_names.admin_chat') },
    { id: 'benchmark_generation', label: t('admin.settings.ai.task_names.benchmark_generation') },
  ];

  // General Form Schema (Inside component to use t)
  const generalSchema = z.object({
    platform_name: z.string().min(2, t('admin.settings.general.error_platform_name')),
    platform_url: z.string().url(t('admin.settings.general.error_platform_url')),
    anonymity_threshold: z.number().min(3).max(20),
    score_alert_threshold: z.number().min(20).max(80),
    admin_email: z.string().email(t('common.invalid_email')).optional().or(z.literal('')),
    debug_mode: z.boolean().default(true),
    platform_logo_url: z.string().optional().or(z.literal('')),
  });

  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);
  const [isDirty, setIsDirty] = useState(false);

  // General Form
  const { register: regGeneral, handleSubmit: handleSubGeneral, reset: resetGeneral } = useForm({
    resolver: zodResolver(generalSchema)
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await client.get('/settings');
      setSettings(res.data);
      resetGeneral({
        platform_name: res.data.platform_name,
        platform_url: res.data.platform_url,
        anonymity_threshold: res.data.anonymity_threshold,
        score_alert_threshold: res.data.score_alert_threshold,
        admin_email: res.data.admin_email || '',
        debug_mode: res.data.debug_mode ?? true,
        platform_logo_url: res.data.platform_logo_url || '',
      });
    } catch (err: any) {
      console.error('[Settings] Fetch Error:', err);
      toast.error(err.response?.data?.error?.message || t('admin.settings.general.fetch_error'));
    } finally {
      setLoading(false);
    }

  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const onUpdateGeneral = async (data: any) => {
    try {
      await client.put('/settings', data);
      toast.success(t('admin.settings.general.save_success'));
      setIsDirty(false);
    } catch (err: any) {
      console.error('[Settings] General Update Error:', err);
      toast.error(err.response?.data?.error?.message || t('common.save_error'));
    }

  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-4">
        <XCircle className="text-danger" size={48} />
        <p className="text-navy font-bold">{t('admin.settings.general.load_failed')}</p>
        <Button onClick={fetchSettings} variant="secondary">{t('common.retry')}</Button>
      </div>
    );

  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-navy tracking-tight">{t('admin.settings.title')}</h1>
          <p className="text-slate-500 font-medium">{t('admin.settings.subtitle')}</p>
        </div>
        {isDirty && (
          <div className="px-4 py-2 bg-amber-50 text-amber-600 rounded-xl text-xs font-bold border border-amber-100 animate-pulse">
            {t('common.unsaved_changes')}
          </div>
        )}

      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="lg:w-72 flex-shrink-0">
          <div className="sticky top-24 space-y-2 bg-white/50 p-2 rounded-2xl border border-slate-100">
            <TabNavItem id="general" icon={SettingsIcon} label={t('admin.settings.tabs.general')} active={activeTab === 'general'} onClick={setActiveTab} />
            <TabNavItem id="ai" icon={Bot} label={t('admin.settings.tabs.ai')} active={activeTab === 'ai'} onClick={setActiveTab} />
            <TabNavItem id="mail" icon={Mail} label={t('admin.settings.tabs.mail')} active={activeTab === 'mail'} onClick={setActiveTab} />
            <TabNavItem id="storage" icon={HardDrive} label={t('admin.settings.tabs.storage')} active={activeTab === 'storage'} onClick={setActiveTab} />
            <TabNavItem id="payment" icon={CreditCard} label={t('admin.settings.tabs.payment')} active={activeTab === 'payment'} onClick={setActiveTab} />
            <TabNavItem id="legal" icon={ShieldCheck} label={t('admin.settings.tabs.legal')} active={activeTab === 'legal'} onClick={setActiveTab} />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {activeTab === 'general' && (
            <Card title={t('admin.settings.general.card_title')} className="shadow-sm border-slate-100">
                {/* Independent Logo Section */}
                <div className="space-y-4 pb-8 border-b border-slate-50">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">{t('admin.settings.general.platform_logo')}</label>
                  <div className="flex items-start gap-6">
                    <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0 group relative">
                      {settings?.platform_logo_url ? (
                        <img src={settings.platform_logo_url} className="w-full h-full object-contain" alt="Logo" />
                      ) : (
                        <Plus className="text-slate-300" size={32} />
                      )}
                      <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <Plus className="text-white" size={24} />
                        <input 
                          type="file" 
                          className="sr-only" 
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            
                            const toastId = toast.loading(t('common.uploading'));
                            try {
                              const { data: presigned } = await client.post('/uploads/presigned-url', {
                                file_type: 'platform_logo',
                                mime_type: file.type,
                                file_size: file.size
                              });

                              await axios.put(presigned.presigned_url, file, {
                                headers: { 'Content-Type': file.type }
                              });

                              await client.post('/uploads/confirm', {
                                s3_key: presigned.s3_key,
                                context: 'platform_logo'
                              });

                              toast.success(t('common.upload_success'), { id: toastId });
                              fetchSettings(); // Refresh UI
                            } catch (err: any) {
                              toast.error(err.response?.data?.error?.message || t('common.upload_error'), { id: toastId });
                            }
                          }}
                        />
                      </label>
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-bold text-navy">{t('admin.settings.general.platform_logo_desc', { defaultValue: 'Logo Yönetimi' })}</p>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {t('admin.settings.general.platform_logo_url_desc', { defaultValue: 'Platform logosunu buradan değiştirebilirsiniz. Yüklediğiniz görsel tüm sayfalarda ve e-postalarda otomatik olarak güncellenir.' })}
                      </p>
                      {settings?.platform_logo_url && (
                        <div className="pt-2">
                          <code className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500">{settings.platform_logo_url}</code>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubGeneral(onUpdateGeneral)} className="space-y-8 max-w-2xl pt-4">
                  <div className="grid gap-6">
                    <InputGroup label={t('admin.settings.general.platform_name')} {...regGeneral('platform_name')} />
                    <InputGroup label={t('admin.settings.general.platform_url')} {...regGeneral('platform_url')} />
                    <InputGroup 
                      label={t('admin.settings.general.admin_email')} 
                      placeholder="admin@wellanalytics.io"
                      {...regGeneral('admin_email')} 
                      description={t('admin.settings.general.admin_email_desc')}
                    />

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <p className="text-xs font-bold text-navy uppercase tracking-widest">{t('admin.settings.general.debug_mode')}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{t('admin.settings.general.debug_mode_desc')}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" {...regGeneral('debug_mode')} className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                  
                  <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('admin.settings.general.anonymity_threshold')}</label>
                        <span className="text-xs font-black text-primary bg-primary/5 px-2 py-0.5 rounded-lg">{settings.anonymity_threshold}</span>
                      </div>
                      <input type="range" min="3" max="20" {...regGeneral('anonymity_threshold', { valueAsNumber: true })} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary" />
                      <p className="text-[10px] text-slate-400 leading-tight">{t('admin.settings.general.anonymity_desc')}</p>
                    </div>


                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('admin.settings.general.risk_alert_threshold')}</label>
                        <span className="text-xs font-black text-orange-500 bg-orange-50 px-2 py-0.5 rounded-lg">{settings.score_alert_threshold}</span>
                      </div>
                      <input type="range" min="20" max="80" {...regGeneral('score_alert_threshold', { valueAsNumber: true })} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-orange-500" />
                      <p className="text-[10px] text-slate-400 leading-tight">{t('admin.settings.general.risk_alert_desc')}</p>
                    </div>

                  </div>
                </div>

                <div className="pt-6 border-t border-slate-50">
                  <Button type="submit" className="px-8 py-3 rounded-xl premium-gradient text-white flex gap-2 items-center">
                    <Save size={18} />
                    {t('save_settings')}
                  </Button>
                </div>

              </form>
            </Card>
          )}

          {activeTab === 'ai' && <AiSettingsTab settings={settings} onRefresh={fetchSettings} TASKS={TASKS} t={t} />}
          {activeTab === 'mail' && <MailSettingsTab settings={settings} onRefresh={fetchSettings} t={t} />}
          {activeTab === 'storage' && <StorageSettingsTab settings={settings} onRefresh={fetchSettings} t={t} />}
          {activeTab === 'payment' && <PaymentSettingsTab t={t} />}
          {activeTab === 'legal' && <LegalSettingsTab settings={settings} onRefresh={fetchSettings} t={t} />}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ────────────────────────────────────────────────────────────────────────────

function TabNavItem({ id, icon: Icon, label, active, onClick }: { id: string, icon: any, label: string, active: boolean, onClick: (id: string) => void }) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center gap-4 w-full px-5 py-4 rounded-xl transition-all duration-300 ${
        active 
          ? 'bg-white text-primary shadow-lg shadow-primary/5 ring-1 ring-slate-100 font-black' 
          : 'text-slate-400 hover:bg-white hover:text-navy hover:shadow-sm'
      }`}
    >
      <div className={`p-2 rounded-lg ${active ? 'bg-primary/10 text-primary' : 'bg-slate-50 text-slate-400'}`}>
        <Icon size={18} />
      </div>
      <span className="text-sm tracking-tight">{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
    </button>
  );
}

const InputGroup = React.forwardRef(({ label, error, description, ...props }: any, ref) => (
  <div className="space-y-2">
    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <input 
      ref={ref}
      {...props}
      className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-medium outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white transition-all" 
    />
    {description && <p className="text-[10px] text-slate-400 font-medium ml-1 leading-tight">{description}</p>}
    {error && <p className="text-[10px] text-red-500 font-bold uppercase mt-1 ml-1">{error}</p>}
  </div>
));

// ────────────────────────────────────────────────────────────────────────────
// AI SETTINGS TAB
// ────────────────────────────────────────────────────────────────────────────

function AiSettingsTab({ settings, onRefresh, TASKS, t }: { settings: any, onRefresh: () => void, TASKS: any[], t: any }) {
  const [taskModels, setTaskModels] = useState(settings.ai_task_models || {});
  const [aiEnabled, setAiEnabled] = useState(settings.ai_enabled);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (settings.ai_task_models) {
      setTaskModels(settings.ai_task_models);
    }
    if (settings.ai_enabled !== undefined) {
      setAiEnabled(settings.ai_enabled);
    }
  }, [settings]);

  const onUpdateToggle = async (val: boolean) => {
    setAiEnabled(val);
    try {
      await client.put('/settings', { ai_enabled: val });
      toast.success(t(val ? 'settings.ai.toggle_success_on' : 'settings.ai.toggle_success_off'));
    } catch (err: any) {
      console.error('[Settings] Load Error:', err);
      toast.error(err.response?.data?.error?.message || t('common.error'));
    } finally {
      //
    }
  };

  const onUpdateModels = async () => {
    setLoading(true);
    try {
      // Ensure each task has both provider and model
      const payload: any = {};
      TASKS.forEach(task => {
        const current = taskModels[task.id] || {};
        payload[task.id] = {
          provider: current.provider || 'anthropic',
          model: current.model || (settings.ai_task_models?.[task.id]?.model) || ''
        };
      });

      await client.patch('/settings/ai-models', payload);
      toast.success(t('admin.settings.ai.update_success'));
      onRefresh();
    } catch (err: any) {
      console.error('[Settings] Update Error:', err);
      toast.error(err.response?.data?.error?.message || t('common.save_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-slate-100 overflow-visible">
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-50">
          <div>
            <h3 className="text-lg font-black text-navy tracking-tight">{t('admin.settings.ai.title')}</h3>
            <p className="text-sm text-slate-500 font-medium">{t('admin.settings.ai.subtitle')}</p>
          </div>
          <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            <span className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-xl transition-all cursor-pointer ${!aiEnabled ? 'bg-white text-slate-600 shadow-sm' : 'text-slate-400'}`} onClick={() => onUpdateToggle(false)}>{t('admin.settings.ai.passive')}</span>
            <span className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-xl transition-all cursor-pointer ${aiEnabled ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400'}`} onClick={() => onUpdateToggle(true)}>{t('admin.settings.ai.active')}</span>
          </div>
        </div>

        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
              <tr>
                <th className="py-4 px-4 w-1/3">{t('admin.settings.ai.task')}</th>
                <th className="py-4 px-4">{t('admin.settings.ai.provider')}</th>
                <th className="py-4 px-4">{t('admin.settings.ai.model')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {TASKS.map((task) => (
                <tr key={task.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="py-5 px-4 font-bold text-navy">{task.label}</td>
                  <td className="py-5 px-4">
                    <select 
                      value={taskModels[task.id]?.provider || 'anthropic'}
                      onChange={(e) => setTaskModels({...taskModels, [task.id]: { ...taskModels[task.id], provider: e.target.value }})}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer"
                    >
                      {PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </td>
                  <td className="py-5 px-4">
                    <ModelSelector 
                      provider={taskModels[task.id]?.provider || 'anthropic'} 
                      value={taskModels[task.id]?.model || ''}
                      onChange={(model) => setTaskModels({...taskModels, [task.id]: { ...taskModels[task.id], model }})}
                      t={t}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex justify-end">
          <Button disabled={loading} onClick={onUpdateModels} className="flex gap-2 items-center px-6 py-2.5 rounded-xl bg-navy text-white hover:bg-black transition-all">
            {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
            {t('admin.settings.ai.update_config')}
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PROVIDERS.filter(p => p.id !== 'ollama').map((p) => (
          <ApiKeyCard key={p.id} provider={p} initialMaskedKey={settings.api_keys?.[p.id]} t={t} />
        ))}
      </div>
    </div>
  );
}

function ModelSelector({ provider, value, onChange, t }: { provider: string, value: string, onChange: (v: string) => void, t: any }) {
  if (provider === 'azure_openai' || provider === 'ollama') {
    return (
      <input 
        type="text" 
        placeholder="Model / Deployment ID" 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10 w-full" 
      />
    );
  }

  const options = MODELS[provider] || [];
  return (
    <select 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10 w-full cursor-pointer"
    >
      <option value="">{t('admin.settings.ai.model')}</option>
      {options.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
    </select>
  );
}

function ApiKeyCard({ provider, initialMaskedKey, t }: { provider: any, initialMaskedKey?: string, t: any }) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [config, setConfig] = useState<any>({});
  const [imgError, setImgError] = useState(false);

  const onUpdate = async () => {
    setLoading(true);
    try {
      await client.put('/settings/api-keys', { provider: provider.id, config });
      toast.success(t('admin.settings.ai.save_success'));
      setIsEditing(false);
    } catch (err: any) {
      console.error('[Settings] API Key Update Error:', err);
      toast.error(err.response?.data?.error?.message || t('admin.settings.ai.error_update_keys'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-sm border-slate-100 group">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center shadow-sm overflow-hidden group-hover:border-primary/30 transition-all duration-500">
          {!imgError ? (
            <img 
              src={provider.icon} 
              className="w-7 h-7 transition-all duration-500 transform group-hover:scale-110 object-contain" 
              alt={provider.name}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full bg-slate-50 flex items-center justify-center text-primary font-black text-xl">
              {provider.name[0]}
            </div>
          )}
        </div>
        <div className="flex-1">
          <h4 className="font-black text-navy">{provider.name}</h4>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${initialMaskedKey ? 'bg-primary' : 'bg-slate-300'}`} />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{initialMaskedKey ? t('admin.settings.ai.configured') : t('admin.settings.ai.not_configured')}</span>
          </div>
        </div>
        <button onClick={() => setIsEditing(!isEditing)} className="p-2 text-slate-400 hover:text-primary transition-colors">
          <ChevronRight className={`transition-transform duration-300 ${isEditing ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {isEditing && (
        <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
          {provider.id === 'azure_openai' ? (
            <>
              <InputGroup label="Endpoint URL" placeholder="https://resource.openai.azure.com" onChange={(e: any) => setConfig({...config, endpoint_url: e.target.value})} />
              <InputGroup label="Deployment Name" onChange={(e: any) => setConfig({...config, deployment_name: e.target.value})} />
              <InputGroup label="API Version" placeholder="2024-02-01" onChange={(e: any) => setConfig({...config, api_version: e.target.value})} />
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">API Key</label>
                <div className="relative">
                  <input 
                    type={showKey ? 'text' : 'password'} 
                    onChange={(e: any) => setConfig({...config, api_key: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-mono outline-none focus:border-primary" 
                  />
                  <button onClick={() => setShowKey(!showKey)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </>
          ) : provider.id === 'aws_bedrock' ? (
            <>
              <InputGroup label="Access Key ID" onChange={(e: any) => setConfig({...config, access_key_id: e.target.value})} />
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Secret Access Key</label>
                <input type="password" onChange={(e: any) => setConfig({...config, secret_access_key: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Region</label>
                <select onChange={(e: any) => setConfig({...config, region: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary">
                  <option value="us-east-1">us-east-1 (N. Virginia)</option>
                  <option value="eu-west-1">eu-west-1 (Ireland)</option>
                </select>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">API Key</label>
              <div className="relative">
                <input 
                  type={showKey ? 'text' : 'password'} 
                  placeholder={initialMaskedKey || '••••••••••••'}
                  onChange={(e: any) => setConfig({...config, api_key: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-mono outline-none focus:border-primary" 
                />
                <button onClick={() => setShowKey(!showKey)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {provider.id === 'openai' && (
                <div className="pt-2">
                   <InputGroup label={t('admin.settings.ai.org_id_optional', { defaultValue: 'Organization ID (Optional)' })} onChange={(e: any) => setConfig({...config, organization_id: e.target.value})} />
                </div>
              )}
            </div>
          )}

          <Button disabled={loading} onClick={onUpdate} className="w-full py-3 rounded-2xl bg-navy text-white font-bold text-xs uppercase tracking-widest flex justify-center items-center gap-2">
            {loading ? <Loader2 className="animate-spin" size={14} /> : <RefreshCcw size={14} />}
            {t('save_settings')}
          </Button>
        </div>
      )}
    </Card>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// MAIL SETTINGS TAB
// ────────────────────────────────────────────────────────────────────────────

function MailSettingsTab({ settings, onRefresh, t }: { settings: any, onRefresh: () => void, t: any }) {
  
  // mail_config.provider_specific yapısını destekle
  const initialProvider = settings.mail_provider || 'resend';
  const providerSpecific = settings.mail_config?.provider_specific || {};
  
  const [provider, setProvider] = useState(initialProvider);
  // O anki aktif provider'ın konfigürasyonu
  const [config, setConfig] = useState<any>(providerSpecific[initialProvider] || settings.mail_config || {});
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [quotas, setQuotas] = useState({
    capacity: settings.mail_quota_capacity || 3000,
    used: settings.mail_quota_used || 0
  });

  // Provider değişince formu güncelle
  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider);
    // Eğer hafızada bu provider'ın ayarı varsa onu yükle, yoksa boş obje
    setConfig(providerSpecific[newProvider] || {});
  };

  const onSave = async () => {
    setLoading(true);
    try {
      await client.put('/settings', {
        mail_provider: provider,
        mail_config: config,
        mail_from_address: settings.mail_from_address,
        mail_from_name: settings.mail_from_name,
        mail_quota_capacity: quotas.capacity,
        mail_quota_used: quotas.used,
      });
      toast.success(t('admin.settings.mail.save_success'));
      onRefresh();
    } catch (err: any) {
      console.error('[Settings] Mail Update Error:', err);
      toast.error(err.response?.data?.error?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const onTest = async () => {
    if (!testEmail) return toast.error(t('admin.settings.mail.error_test_empty'));
    setTestLoading(true);
    try {
      // Direct pipeline test for diagnostics
      await client.post('/admin/notification/test-pipeline', { to: testEmail });
      toast.success(t('admin.settings.mail.test_success'));
    } catch (err: any) {
      toast.error(`✗ ${t('common.error')}: ${err.response?.data?.message || t('common.unknown')}`);
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card title={t('admin.settings.mail.title')}>
        <div className="space-y-8 max-w-2xl">
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('admin.settings.mail.select_provider')}</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <ProviderCard id="resend" icon="📮" label="Resend" active={provider === 'resend'} onClick={handleProviderChange} />
              <ProviderCard id="sendgrid" icon="📧" label="SendGrid" active={provider === 'sendgrid'} onClick={handleProviderChange} />
              <ProviderCard id="aws_ses" icon="☁️" label="AWS SES" active={provider === 'aws_ses'} onClick={handleProviderChange} />
              <ProviderCard id="smtp" icon="🖥️" label="SMTP" active={provider === 'smtp'} onClick={handleProviderChange} />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-50 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-50">
              <InputGroup 
                label={t('admin.settings.mail.quota_capacity', { defaultValue: 'Mail Kota Kapasitesi' })} 
                type="number" 
                value={quotas.capacity} 
                onChange={(e: any) => setQuotas({...quotas, capacity: parseInt(e.target.value) || 0})}
                description={t('admin.settings.mail.quota_capacity_desc', { defaultValue: 'Aylık toplam gönderim limitiniz' })}
              />
              <InputGroup 
                label={t('admin.settings.mail.quota_used', { defaultValue: 'Kullanılan Mail' })} 
                type="number" 
                value={quotas.used} 
                onChange={(e: any) => setQuotas({...quotas, used: parseInt(e.target.value) || 0})}
                description={t('admin.settings.mail.quota_used_desc', { defaultValue: 'Şu ana kadar harcanan miktar' })}
              />
            </div>

            {provider === 'resend' && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50/50 rounded-2xl flex items-start gap-3 border border-blue-100">
                  <Info className="text-blue-500 flex-shrink-0" size={18} />
                  <p className="text-xs text-blue-600 leading-relaxed font-medium">
                    {t('admin.settings.mail.info_resend')} <a href="https://resend.com" target="_blank" className="font-bold underline flex items-center gap-1 mt-1">{t('admin.settings.mail.get_api_key')} → <ExternalLink size={10} /></a>
                  </p>
                </div>
                <InputGroup label={t('admin.settings.mail.api_key')} type="password" value={config.api_key || ''} onChange={(e: any) => setConfig({...config, api_key: e.target.value})} />
              </div>
            )}

            {provider === 'sendgrid' && (
              <InputGroup label="SendGrid API Key" type="password" value={config.api_key || ''} onChange={(e: any) => setConfig({...config, api_key: e.target.value})} />
            )}

            {provider === 'aws_ses' && (
              <div className="grid gap-6">
                <InputGroup label="Access Key ID" value={config.access_key_id || ''} onChange={(e: any) => setConfig({...config, access_key_id: e.target.value})} />
                <InputGroup label="Secret Access Key" type="password" value={config.secret_access_key || ''} onChange={(e: any) => setConfig({...config, secret_access_key: e.target.value})} />
                <InputGroup label="Region" value={config.region || ''} placeholder="eu-central-1" onChange={(e: any) => setConfig({...config, region: e.target.value})} />
              </div>
            )}

            {provider === 'smtp' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputGroup label="SMTP Host" value={config.host || ''} placeholder="smtp.gmail.com" onChange={(e: any) => setConfig({...config, host: e.target.value})} />
                <InputGroup label="Port" type="number" value={config.port || ''} placeholder="587" onChange={(e: any) => setConfig({...config, port: parseInt(e.target.value) || 587})} />
                <InputGroup label={t('admin.settings.mail.smtp_user', { defaultValue: 'Kullanıcı Adı' })} value={config.user || ''} onChange={(e: any) => setConfig({...config, user: e.target.value})} />
                <InputGroup label={t('admin.settings.mail.smtp_pass', { defaultValue: 'Şifre' })} type="password" value={config.password || config.pass || ''} onChange={(e: any) => setConfig({...config, password: e.target.value})} />
              </div>
            )}
          </div>

          <div className="pt-8 border-t border-slate-50">
            <Button disabled={loading} onClick={onSave} className="px-8 py-3 rounded-xl premium-gradient text-white flex gap-2 items-center">
              <Save size={18} />
              {t('admin.settings.mail.save_config')}
            </Button>
          </div>
        </div>
      </Card>

      <Card title={t('admin.settings.mail.test_mail')}>
        <div className="flex flex-col md:flex-row gap-4 items-end max-w-2xl">
          <div className="flex-1 w-full">
            <InputGroup label={t('admin.settings.mail.test_address')} value={testEmail} onChange={(e: any) => setTestEmail(e.target.value)} placeholder="isim@sirket.com" />
          </div>
          <Button 
            variant="primary" 
            disabled={testLoading} 
            onClick={onTest} 
            className="h-[52px] px-8 rounded-xl premium-gradient text-white shadow-lg flex gap-2 items-center"
          >
            {testLoading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCcw size={18} />}
            {t('admin.settings.mail.send_test')}
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// STORAGE SETTINGS TAB
// ────────────────────────────────────────────────────────────────────────────

function StorageSettingsTab({ settings, onRefresh, t }: { settings: any, onRefresh: () => void, t: any }) {
  const [provider, setProvider] = useState(settings.storage_provider || 'cloudflare_r2');
  const [config, setConfig] = useState<any>(settings.storage_config || {});
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  const onSave = async () => {
    setLoading(true);
    try {
      await client.put('/settings', {
        storage_provider: provider,
        storage_config: config,
      });
      toast.success(t('admin.settings.storage.save_success'));
      onRefresh();
    } catch (err: any) {
      console.error('[Settings] Storage Update Error:', err);
      toast.error(err.response?.data?.error?.message || t('common.save_error'));
    } finally {
      setLoading(false);
    }
  };

  const onTest = async () => {
    setTestLoading(true);
    try {
      const res = await client.post('/settings/storage/test');
      toast.success(t('admin.settings.storage.test_success', { latency: res.data.latency_ms }));
    } catch (err: any) {
      toast.error(`✗ ${t('common.error')}: ${err.response?.data?.message || t('common.unknown')}`);
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card title={t('admin.settings.storage.title')}>
        <div className="space-y-8 max-w-2xl">
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('admin.settings.storage.provider')}</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <ProviderCard id="cloudflare_r2" icon="☁️" label="Cloudflare R2" active={provider === 'cloudflare_r2'} onClick={setProvider} />
              <ProviderCard id="aws_s3" icon="🪣" label="AWS S3" active={provider === 'aws_s3'} onClick={setProvider} />
              <ProviderCard id="minio" icon="🖥️" label="MinIO" active={provider === 'minio'} onClick={setProvider} />
              <ProviderCard id="local" icon="📁" label={t('admin.settings.storage.provider_labels.local')} active={provider === 'local'} onClick={setProvider} />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-50">
             {provider === 'cloudflare_r2' && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <InputGroup label="Account ID" value={config.account_id || ''} onChange={(e: any) => setConfig({...config, account_id: e.target.value})} />
                 <InputGroup label="Bucket Adı" value={config.bucket_name || ''} onChange={(e: any) => setConfig({...config, bucket_name: e.target.value})} />
                 <InputGroup label="Access Key ID" value={config.access_key_id || ''} onChange={(e: any) => setConfig({...config, access_key_id: e.target.value})} />
                 <InputGroup label="Secret Access Key" type="password" value={config.secret_access_key || ''} onChange={(e: any) => setConfig({...config, secret_access_key: e.target.value})} />
                 <div className="md:col-span-2">
                   <InputGroup label="Custom Domain (Opsiyonel)" placeholder="https://files.wellbeingmetric.com" value={config.custom_domain || ''} onChange={(e: any) => setConfig({...config, custom_domain: e.target.value})} />
                 </div>
               </div>
             )}

             {provider === 'aws_s3' && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <InputGroup label="Access Key ID" value={config.access_key_id || ''} onChange={(e: any) => setConfig({...config, access_key_id: e.target.value})} />
                 <InputGroup label="Secret Access Key" type="password" value={config.secret_access_key || ''} onChange={(e: any) => setConfig({...config, secret_access_key: e.target.value})} />
                 <InputGroup label="Region" value={config.region || ''} placeholder="us-east-1" onChange={(e: any) => setConfig({...config, region: e.target.value})} />
                 <InputGroup label="Bucket Adı" value={config.bucket_name || ''} onChange={(e: any) => setConfig({...config, bucket_name: e.target.value})} />
               </div>
             )}

             {provider === 'minio' && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <InputGroup label="Endpoint URL" value={config.endpoint || ''} placeholder="https://minio.sirket.com" onChange={(e: any) => setConfig({...config, endpoint: e.target.value})} />
                 <InputGroup label="Bucket Adı" value={config.bucket_name || ''} onChange={(e: any) => setConfig({...config, bucket_name: e.target.value})} />
                 <InputGroup label="Access Key" value={config.access_key || ''} onChange={(e: any) => setConfig({...config, access_key: e.target.value})} />
                 <InputGroup label="Secret Key" type="password" value={config.secret_key || ''} onChange={(e: any) => setConfig({...config, secret_key: e.target.value})} />
               </div>
             )}

             {provider === 'local' && (
               <div className="space-y-4">
                  <div className="p-4 bg-orange-50/50 rounded-2xl flex items-start gap-3 border border-orange-100">
                    <Info className="text-orange-500 flex-shrink-0" size={18} />
                    <p className="text-xs text-orange-600 leading-relaxed font-medium">
                      {t('admin.settings.storage.local_warning')}
                    </p>
                  </div>
                  <InputGroup label="Yükleme Dizini (Path)" placeholder="/var/www/wellanalytics/uploads" value={config.path || ''} onChange={(e: any) => setConfig({...config, path: e.target.value})} />
                  <InputGroup label="Erişim URL" placeholder="https://app.wellbeingmetric.com/uploads" value={config.url || ''} onChange={(e: any) => setConfig({...config, url: e.target.value})} />
               </div>
             )}
          </div>

          <div className="pt-8 border-t border-slate-50 flex flex-col sm:flex-row gap-4">
            <Button disabled={loading} onClick={onSave} className="px-8 py-3 rounded-xl premium-gradient text-white flex gap-2 items-center">
              <Save size={18} />
              {t('save_settings')}
            </Button>
            <Button variant="ghost" disabled={testLoading} onClick={onTest} className="px-6 py-3 rounded-xl border border-slate-100 font-bold text-navy flex gap-2 items-center">
              {testLoading ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
              {t('admin.settings.storage.test_connection')}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ProviderCard({ id, icon, label, active, onClick }: { id: string, icon: string, label: string, active: boolean, onClick: (id: string) => void }) {
  return (
    <button 
      onClick={() => onClick(id)}
      className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 gap-2 ${
        active 
          ? 'bg-primary/5 border-primary shadow-lg shadow-primary/5 ring-1 ring-primary/10' 
          : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
      }`}
    >
      <span className="text-2xl">{icon}</span>
      <span className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-primary' : 'text-slate-400'}`}>{label}</span>
      {active && <CheckCircle2 className="absolute top-2 right-2 text-primary" size={12} />}
    </button>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// PAYMENT SETTINGS TAB
// ────────────────────────────────────────────────────────────────────────────

function PaymentSettingsTab({ t }: { t: any }) {
  const [settings, setSettings] = useState<any>(null);
  const [saving, setSaving]     = useState<string | null>(null);
  const [editing, setEditing]   = useState<string | null>(null);
  const [keyForm, setKeyForm]   = useState<Record<string, string>>({});

  const fetchPaymentSettings = () => {
    client.get('/settings/payment')
      .then(res => setSettings(res.data))
      .catch(err => toast.error(t('admin.settings.payment.fetch_error')));
  };

  useEffect(() => {
    fetchPaymentSettings();
  }, []);

  const handleToggle = async (providerKey: string, current: boolean) => {
    setSaving(providerKey);
    try {
      await client.patch(`/settings/payment/providers/${providerKey}/toggle`, { is_active: !current });
      toast.success(`${providerKey.toUpperCase()} ${!current ? t('admin.settings.ai.active').toLowerCase() : t('admin.settings.ai.passive').toLowerCase()} ${t('common.waiting').toLowerCase()}`);
      setSettings((s: any) => ({
        ...s,
        providers: {
          ...s.providers,
          [providerKey]: { ...s.providers[providerKey], is_active: !current }
        }
      }));
    } catch (err) {
      toast.error(t('common.error'));
    } finally {
      setSaving(null);
    }
  };

  const handleSaveKeys = async (providerKey: string) => {
    setSaving(providerKey + '_keys');
    try {
      await client.put('/settings/payment', {
        providers: { [providerKey]: keyForm }
      });
      toast.success(t('admin.settings.payment.save_keys_success'));
      setEditing(null);
      setKeyForm({});
      fetchPaymentSettings();
    } catch (err) {
      toast.error(t('common.save_error'));
    } finally {
      setSaving(null);
    }
  };

  if (!settings) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="animate-spin text-primary" size={40} />
    </div>
  );

  const PROVIDER_FIELDS: Record<string, Array<{key: string; label: string; secret: boolean}>> = {
    stripe: [
      { key: 'public_key',     label: 'Public Key',      secret: false },
      { key: 'secret_key',     label: 'Secret Key',      secret: true  },
      { key: 'webhook_secret', label: 'Webhook Secret',  secret: true  },
    ],
    paytr: [
      { key: 'merchant_id',   label: 'Merchant ID',   secret: false },
      { key: 'merchant_key',  label: 'Merchant Key',  secret: true  },
      { key: 'merchant_salt', label: 'Merchant Salt', secret: true  },
    ],
    paypal: [
      { key: 'client_id',     label: 'Client ID',     secret: false },
      { key: 'client_secret', label: 'Client Secret', secret: true  },
      { key: 'mode',          label: 'Mode (sandbox/live)', secret: false },
    ],
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-slate-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-black text-navy uppercase tracking-tight text-sm">{t('admin.settings.payment.default_provider')}</h4>
            <p className="text-xs text-slate-400 font-medium mt-1">{t('admin.settings.payment.default_provider_desc')}</p>
          </div>
          <select
            value={settings.default_provider ?? 'paytr'}
            onChange={async e => {
              try {
                await client.put('/settings/payment', { default_provider: e.target.value });
                setSettings((s: any) => ({ ...s, default_provider: e.target.value }));
                toast.success(t('admin.settings.payment.save_success'));
              } catch (err) {
                toast.error(t('common.error'));
              }
            }}
            className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-primary transition-all min-w-[200px]"
          >
            {Object.entries(settings.providers ?? {})
              .filter(([, c]: any) => c.is_active)
              .map(([key, c]: any) => (
                <option key={key} value={key}>{c.label ?? key}</option>
              ))}
          </select>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        {Object.entries(settings.providers ?? {}).map(([providerKey, config]: any) => (
          <Card key={providerKey} className={`overflow-hidden border-2 transition-all duration-300 ${config.is_active ? 'border-primary/10 shadow-lg shadow-primary/5' : 'border-slate-100 opacity-80'}`}>
            <div className={`px-6 py-4 flex items-center justify-between ${config.is_active ? 'bg-primary/5' : 'bg-slate-50'}`}>
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-xl ${config.is_active ? 'bg-white text-primary' : 'bg-slate-100 text-slate-400'}`}>
                  <CreditCard size={20} />
                </div>
                <div>
                  <h5 className="font-black text-slate-900 text-sm tracking-tight">{config.label}</h5>
                  <div className="flex gap-1 mt-0.5">
                    {(config.currencies ?? []).map((curr: string) => (
                      <span key={curr} className="text-[9px] font-black bg-white/50 px-1.5 py-0.5 rounded border border-slate-100 text-slate-400">{curr}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${config.is_active ? 'text-primary' : 'text-slate-400'}`}>
                    {config.is_active ? t('admin.settings.payment.active') : t('admin.settings.payment.passive')}
                  </span>
                  <button
                    onClick={() => handleToggle(providerKey, config.is_active)}
                    disabled={saving === providerKey}
                    className={`relative w-12 h-6 rounded-full transition-all duration-300 ${config.is_active ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${config.is_active ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    if (editing === providerKey) setEditing(null);
                    else { setEditing(providerKey); setKeyForm({}); }
                  }}
                  className="bg-white border-slate-200 text-slate-600 font-bold text-xs px-4 h-9 rounded-lg"
                >
                  {editing === providerKey ? t('admin.settings.payment.cancel') : t('admin.settings.payment.edit_api_keys')}
                </Button>
              </div>
            </div>

            {editing === providerKey && (
              <div className="p-8 bg-white border-t border-slate-50 animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-100 mb-8">
                  <Info className="text-amber-500 shrink-0 mt-0.5" size={18} />
                  <p className="text-xs text-amber-700 font-medium leading-relaxed">
                    {t('admin.settings.payment.save_keys_hint')}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {(PROVIDER_FIELDS[providerKey] ?? []).map(field => (
                    <div key={field.key} className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between">
                        {field.label}
                        {config[field.key] && (
                          <span className="text-slate-300 font-bold lowercase tracking-normal">{config[field.key]}</span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          type={field.secret ? 'password' : 'text'}
                          value={keyForm[field.key] ?? ''}
                          onChange={e => setKeyForm(f => ({ ...f, [field.key]: e.target.value }))}
                          placeholder={field.secret ? '••••••••••••••••' : t('admin.settings.payment.new_value_placeholder')}
                          className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary focus:bg-white transition-all"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 mt-10 pt-6 border-t border-slate-50">
                  <Button
                    variant="ghost"
                    onClick={() => { setEditing(null); setKeyForm({}); }}
                    className="text-slate-400 font-bold text-sm"
                  >
                    {t('admin.settings.payment.cancel')}
                  </Button>
                  <Button
                    onClick={() => handleSaveKeys(providerKey)}
                    disabled={saving === providerKey + '_keys'}
                    className="premium-gradient text-white px-8 py-2.5 rounded-xl shadow-lg shadow-primary/20 font-bold"
                  >
                    {saving === providerKey + '_keys' ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    <span className="ml-2">{t('save_settings')}</span>
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
// ────────────────────────────────────────────────────────────────────────────
// LEGAL SETTINGS TAB
// ────────────────────────────────────────────────────────────────────────────

function LegalSettingsTab({ settings, onRefresh, t }: { settings: any, onRefresh: () => void, t: any }) {
  const [loading, setLoading] = useState(false);
  const [legalData, setLegalData] = useState({
    terms_of_use_tr: settings.terms_of_use_tr || '',
    terms_of_use_en: settings.terms_of_use_en || '',
    privacy_policy_tr: settings.privacy_policy_tr || '',
    privacy_policy_en: settings.privacy_policy_en || '',
    kvkk_text_tr: settings.kvkk_text_tr || '',
    gdpr_text_en: settings.gdpr_text_en || '',
  });

  const onSave = async () => {
    setLoading(true);
    try {
      await client.put('/settings', legalData);
      toast.success(t('admin.settings.legal.save_success'));
      onRefresh();
    } catch (err: any) {
      console.error('[Settings] Legal Update Error:', err);
      toast.error(err.response?.data?.error?.message || t('common.save_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (key: string, value: string) => {
    setLegalData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <Card title={t('admin.settings.legal.title')}>
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <TextareaGroup 
              label={t('admin.settings.legal.terms_of_use_tr')} 
              value={legalData.terms_of_use_tr} 
              onChange={(e: any) => handleTextChange('terms_of_use_tr', e.target.value)} 
            />
            <TextareaGroup 
              label={t('admin.settings.legal.terms_of_use_en')} 
              value={legalData.terms_of_use_en} 
              onChange={(e: any) => handleTextChange('terms_of_use_en', e.target.value)} 
            />
            <TextareaGroup 
              label={t('admin.settings.legal.privacy_policy_tr')} 
              value={legalData.privacy_policy_tr} 
              onChange={(e: any) => handleTextChange('privacy_policy_tr', e.target.value)} 
            />
            <TextareaGroup 
              label={t('admin.settings.legal.privacy_policy_en')} 
              value={legalData.privacy_policy_en} 
              onChange={(e: any) => handleTextChange('privacy_policy_en', e.target.value)} 
            />
            <TextareaGroup 
              label={t('admin.settings.legal.kvkk_tr')} 
              value={legalData.kvkk_text_tr} 
              onChange={(e: any) => handleTextChange('kvkk_text_tr', e.target.value)} 
            />
            <TextareaGroup 
              label={t('admin.settings.legal.gdpr_en')} 
              value={legalData.gdpr_text_en} 
              onChange={(e: any) => handleTextChange('gdpr_text_en', e.target.value)} 
            />
          </div>

          <div className="pt-8 border-t border-slate-50">
            <Button disabled={loading} onClick={onSave} className="px-8 py-3 rounded-xl premium-gradient text-white flex gap-2 items-center">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {t('save_settings')}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function TextareaGroup({ label, value, onChange }: { label: string, value: string, onChange: (e: any) => void }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <textarea 
        value={value}
        onChange={onChange}
        rows={8}
        className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-medium outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white transition-all resize-none"
      />
    </div>
  );
}
