'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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
  Package,
  Plus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import client from '@/lib/api/client';
import '@/lib/i18n';

const PROVIDERS = [
  { id: 'anthropic', name: 'Anthropic', icon: '/images/providers/anthropic.svg' },
  { id: 'openai', name: 'OpenAI', icon: '/images/providers/openai.svg' },
  { id: 'azure_openai', name: 'Azure OpenAI', icon: '/images/providers/azure.svg' },
  { id: 'aws_bedrock', name: 'AWS Bedrock', icon: '/images/providers/aws.svg' },
  { id: 'ollama', name: 'Ollama (Local)', icon: '/images/providers/ollama.svg' }
];

const MODELS: Record<string, string[]> = {
  anthropic: ['claude-3-7-sonnet-20250219', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'o1-preview', 'o1-mini'],
  aws_bedrock: ['anthropic.claude-3-5-sonnet-20241022-v2:0', 'meta.llama3-1-70b-instruct-v1:0']
};

export default function SettingsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const [activeTab, setActiveTab] = useState('general');

  const TASKS = [
    { id: 'survey_analysis', label: t('settings.ai.tasks.survey_analysis') },
    { id: 'action_recommendation', label: t('settings.ai.tasks.action_recommendation') },
    { id: 'report_summarization', label: t('settings.ai.tasks.report_summarization') },
    { id: 'ai_chat', label: t('settings.ai.tasks.ai_chat') }
  ];

  // General Form Schema (Inside component to use t)
  const generalSchema = z.object({
    platform_name: z.string().min(2, t('settings.general.error_platform_name')),
    platform_url: z.string().url(t('settings.general.error_platform_url')),
    anonymity_threshold: z.number().min(3).max(20),
    score_alert_threshold: z.number().min(20).max(80),
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
      });
    } catch (err: any) {
      console.error('[Settings] Fetch Error:', err);
      toast.error(err.response?.data?.error?.message || t('settings.general.fetch_error'));
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
      toast.success(t('settings.general.save_success'));
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
        <p className="text-navy font-bold">{t('settings.general.load_failed')}</p>
        <Button onClick={fetchSettings} variant="secondary">{t('common.retry')}</Button>
      </div>
    );

  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-navy tracking-tight">{t('settings.title')}</h1>
          <p className="text-slate-500 font-medium">{t('settings.subtitle')}</p>
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
            <TabNavItem id="general" icon={SettingsIcon} label={t('settings.tabs.general')} active={activeTab === 'general'} onClick={setActiveTab} />
            <TabNavItem id="ai" icon={Bot} label={t('settings.tabs.ai')} active={activeTab === 'ai'} onClick={setActiveTab} />
            <TabNavItem id="mail" icon={Mail} label={t('settings.tabs.mail')} active={activeTab === 'mail'} onClick={setActiveTab} />
            <TabNavItem id="storage" icon={HardDrive} label={t('settings.tabs.storage')} active={activeTab === 'storage'} onClick={setActiveTab} />
            <TabNavItem id="packages" icon={Package} label={t('settings.tabs.packages')} active={activeTab === 'packages'} onClick={setActiveTab} />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {activeTab === 'general' && (
            <Card title={t('settings.general.card_title')} className="shadow-sm border-slate-100">
              <form onSubmit={handleSubGeneral(onUpdateGeneral)} className="space-y-8 max-w-2xl">
                <div className="grid gap-6">
                  <InputGroup label={t('settings.general.platform_name')} {...regGeneral('platform_name')} />
                  <InputGroup label={t('settings.general.platform_url')} {...regGeneral('platform_url')} />

                  
                  <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('settings.general.anonymity_threshold')}</label>
                        <span className="text-xs font-black text-primary bg-primary/5 px-2 py-0.5 rounded-lg">{settings.anonymity_threshold}</span>
                      </div>
                      <input type="range" min="3" max="20" {...regGeneral('anonymity_threshold', { valueAsNumber: true })} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary" />
                      <p className="text-[10px] text-slate-400 leading-tight">{t('settings.general.anonymity_desc')}</p>
                    </div>


                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('settings.general.risk_alert_threshold')}</label>
                        <span className="text-xs font-black text-orange-500 bg-orange-50 px-2 py-0.5 rounded-lg">{settings.score_alert_threshold}</span>
                      </div>
                      <input type="range" min="20" max="80" {...regGeneral('score_alert_threshold', { valueAsNumber: true })} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-orange-500" />
                      <p className="text-[10px] text-slate-400 leading-tight">{t('settings.general.risk_alert_desc')}</p>
                    </div>

                  </div>
                </div>

                <div className="pt-6 border-t border-slate-50">
                  <Button type="submit" className="px-8 py-3 rounded-xl premium-gradient text-white flex gap-2 items-center">
                    <Save size={18} />
                    {t('common.save_settings')}
                  </Button>
                </div>

              </form>
            </Card>
          )}

          {activeTab === 'ai' && <AiSettingsTab settings={settings} onRefresh={fetchSettings} TASKS={TASKS} />}
          {activeTab === 'mail' && <MailSettingsTab settings={settings} onRefresh={fetchSettings} />}
          {activeTab === 'storage' && <StorageSettingsTab settings={settings} onRefresh={fetchSettings} />}
          {activeTab === 'packages' && <PackagesSettingsTab settings={settings} onRefresh={fetchSettings} />}
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

const InputGroup = React.forwardRef(({ label, error, ...props }: any, ref) => (
  <div className="space-y-2">
    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <input 
      ref={ref}
      {...props}
      className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-medium outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white transition-all" 
    />
    {error && <p className="text-[10px] text-red-500 font-bold uppercase mt-1 ml-1">{error}</p>}
  </div>
));

// ────────────────────────────────────────────────────────────────────────────
// AI SETTINGS TAB
// ────────────────────────────────────────────────────────────────────────────

function AiSettingsTab({ settings, onRefresh, TASKS }: { settings: any, onRefresh: () => void, TASKS: any[] }) {
  const { t } = useTranslation(['admin', 'common']);
  const [taskModels, setTaskModels] = useState(settings.ai_task_models || {});
  const [aiEnabled, setAiEnabled] = useState(settings.ai_enabled);
  const [loading, setLoading] = useState(false);

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
      await client.patch('/settings/ai-models', taskModels);
      toast.success(t('settings.ai.update_success'));
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
            <h3 className="text-lg font-black text-navy tracking-tight">{t('settings.ai.title')}</h3>
            <p className="text-sm text-slate-500 font-medium">{t('settings.ai.subtitle')}</p>
          </div>
          <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            <span className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-xl transition-all cursor-pointer ${!aiEnabled ? 'bg-white text-slate-600 shadow-sm' : 'text-slate-400'}`} onClick={() => onUpdateToggle(false)}>{t('settings.ai.passive')}</span>
            <span className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-xl transition-all cursor-pointer ${aiEnabled ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400'}`} onClick={() => onUpdateToggle(true)}>{t('settings.ai.active')}</span>
          </div>
        </div>

        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
              <tr>
                <th className="py-4 px-4 w-1/3">{t('settings.ai.task')}</th>
                <th className="py-4 px-4">{t('settings.ai.provider')}</th>
                <th className="py-4 px-4">{t('settings.ai.model')}</th>
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
            {t('settings.ai.update_config')}
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PROVIDERS.filter(p => p.id !== 'ollama').map((p) => (
          <ApiKeyCard key={p.id} provider={p} initialMaskedKey={settings.api_keys?.[p.id]} />
        ))}
      </div>
    </div>
  );
}

function ModelSelector({ provider, value, onChange }: { provider: string, value: string, onChange: (v: string) => void }) {
  const { t } = useTranslation('admin');
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
      <option value="">{t('settings.ai.model')}</option>
      {options.map(m => <option key={m} value={m}>{m}</option>)}
    </select>
  );
}

function ApiKeyCard({ provider, initialMaskedKey }: { provider: any, initialMaskedKey?: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [config, setConfig] = useState<any>({});

  const onUpdate = async () => {
    setLoading(true);
    try {
      await client.put('/settings/api-keys', { provider: provider.id, config });
      toast.success(t('settings.ai.save_success'));
      setIsEditing(false);
    } catch (err: any) {
      console.error('[Settings] API Key Update Error:', err);
      toast.error(err.response?.data?.error?.message || 'API anahtarları güncellenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-sm border-slate-100">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center shadow-sm">
          <img src={provider.icon} className="w-7 h-7 grayscale group-hover:grayscale-0 transition-all" alt={provider.name} />
        </div>
        <div className="flex-1">
          <h4 className="font-black text-navy">{provider.name}</h4>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${initialMaskedKey ? 'bg-primary' : 'bg-slate-300'}`} />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{initialMaskedKey ? t('settings.ai.configured') : t('settings.ai.not_configured')}</span>
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
                   <InputGroup label="Organization ID (Opsiyonel)" onChange={(e: any) => setConfig({...config, organization_id: e.target.value})} />
                </div>
              )}
            </div>
          )}

          <Button disabled={loading} onClick={onUpdate} className="w-full py-3 rounded-2xl bg-navy text-white font-bold text-xs uppercase tracking-widest flex justify-center items-center gap-2">
            {loading ? <Loader2 className="animate-spin" size={14} /> : <RefreshCcw size={14} />}
            {t('common.save_settings')}
          </Button>
        </div>
      )}
    </Card>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// MAIL SETTINGS TAB
// ────────────────────────────────────────────────────────────────────────────

function MailSettingsTab({ settings, onRefresh }: { settings: any, onRefresh: () => void }) {
  const { t } = useTranslation(['admin', 'common']);
  
  // mail_config.provider_specific yapısını destekle
  const initialProvider = settings.mail_provider || 'resend';
  const providerSpecific = settings.mail_config?.provider_specific || {};
  
  const [provider, setProvider] = useState(initialProvider);
  // O anki aktif provider'ın konfigürasyonu
  const [config, setConfig] = useState<any>(providerSpecific[initialProvider] || settings.mail_config || {});
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testLoading, setTestLoading] = useState(false);

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
        // Backend artik provider_specific merge islemini kendi yapiyor
        mail_config: config,
        mail_from_address: settings.mail_from_address,
        mail_from_name: settings.mail_from_name,
      });
      toast.success(t('settings.mail.save_success'));
      onRefresh();
    } catch (err: any) {
      console.error('[Settings] Mail Update Error:', err);
      toast.error(err.response?.data?.error?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const onTest = async () => {
    if (!testEmail) return toast.error('Lütfen bir test e-postası girin');
    setTestLoading(true);
    try {
      // Direct pipeline test for diagnostics
      await client.post('/admin/notification/test-pipeline', { to: testEmail });
      toast.success(t('settings.mail.test_success'));
    } catch (err: any) {
      toast.error(`✗ ${t('common.error')}: ${err.response?.data?.message || t('common.waiting')}`);
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card title={t('settings.mail.title')}>
        <div className="space-y-8 max-w-2xl">
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('settings.mail.select_provider')}</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <ProviderCard id="resend" icon="📮" label="Resend" active={provider === 'resend'} onClick={handleProviderChange} />
              <ProviderCard id="sendgrid" icon="📧" label="SendGrid" active={provider === 'sendgrid'} onClick={handleProviderChange} />
              <ProviderCard id="aws_ses" icon="☁️" label="AWS SES" active={provider === 'aws_ses'} onClick={handleProviderChange} />
              <ProviderCard id="smtp" icon="🖥️" label="SMTP" active={provider === 'smtp'} onClick={handleProviderChange} />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-50 space-y-6">
            {provider === 'resend' && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50/50 rounded-2xl flex items-start gap-3 border border-blue-100">
                  <Info className="text-blue-500 flex-shrink-0" size={18} />
                  <p className="text-xs text-blue-600 leading-relaxed font-medium">
                    Resend, geliştiriciler için en modern mail gönderme servisidir. <a href="https://resend.com" target="_blank" className="font-bold underline flex items-center gap-1 mt-1">resend.com'dan API Key al → <ExternalLink size={10} /></a>
                  </p>
                </div>
                <InputGroup label={t('settings.mail.api_key')} type="password" value={config.api_key || ''} onChange={(e: any) => setConfig({...config, api_key: e.target.value})} />
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
                <InputGroup label="Kullanıcı Adı" value={config.user || ''} onChange={(e: any) => setConfig({...config, user: e.target.value})} />
                <InputGroup label="Şifre" type="password" value={config.password || config.pass || ''} onChange={(e: any) => setConfig({...config, password: e.target.value})} />
              </div>
            )}
          </div>

          <div className="pt-8 border-t border-slate-50">
            <Button disabled={loading} onClick={onSave} className="px-8 py-3 rounded-xl premium-gradient text-white flex gap-2 items-center">
              <Save size={18} />
              Yapılandırmayı Kaydet
            </Button>
          </div>
        </div>
      </Card>

      <Card title={t('settings.mail.test_mail')}>
        <div className="flex flex-col md:flex-row gap-4 items-end max-w-2xl">
          <div className="flex-1 w-full">
            <InputGroup label={t('settings.mail.test_address')} value={testEmail} onChange={(e: any) => setTestEmail(e.target.value)} placeholder="isim@sirket.com" />
          </div>
          <Button 
            variant="primary" 
            disabled={testLoading} 
            onClick={onTest} 
            className="h-[52px] px-8 rounded-xl premium-gradient text-white shadow-lg flex gap-2 items-center"
          >
            {testLoading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCcw size={18} />}
            Test Gönder
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// STORAGE SETTINGS TAB
// ────────────────────────────────────────────────────────────────────────────

function StorageSettingsTab({ settings, onRefresh }: { settings: any, onRefresh: () => void }) {
  const { t } = useTranslation(['admin', 'common']);
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
      toast.success(t('settings.storage.save_success'));
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
      toast.success(t('settings.storage.test_success', { latency: res.data.latency_ms }));
    } catch (err: any) {
      toast.error(`✗ ${t('common.error')}: ${err.response?.data?.message || 'Bilinmiyor'}`);
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card title={t('settings.storage.title')}>
        <div className="space-y-8 max-w-2xl">
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('settings.storage.provider')}</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <ProviderCard id="cloudflare_r2" icon="☁️" label="Cloudflare R2" active={provider === 'cloudflare_r2'} onClick={setProvider} />
              <ProviderCard id="aws_s3" icon="🪣" label="AWS S3" active={provider === 'aws_s3'} onClick={setProvider} />
              <ProviderCard id="minio" icon="🖥️" label="MinIO" active={provider === 'minio'} onClick={setProvider} />
              <ProviderCard id="local" icon="📁" label="Yerel (VPS)" active={provider === 'local'} onClick={setProvider} />
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
                      Yerel depolama üretim ortamı için önerilmez. Yedekleme ve veri güvenliği sorumluluğu size aittir.
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
              {t('common.save_settings')}
            </Button>
            <Button variant="ghost" disabled={testLoading} onClick={onTest} className="px-6 py-3 rounded-xl border border-slate-100 font-bold text-navy flex gap-2 items-center">
              {testLoading ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
              {t('settings.storage.test_connection')}
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
// PACKAGES SETTINGS TAB
// ────────────────────────────────────────────────────────────────────────────

function PackagesSettingsTab({ settings, onRefresh }: { settings: any, onRefresh: () => void }) {
  const { t } = useTranslation(['admin', 'common']);
  const [packages, setPackages] = useState<any>(settings.consultant_packages || {});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (settings.consultant_packages) {
      setPackages(settings.consultant_packages);
    }
  }, [settings.consultant_packages]);

  const onUpdatePackage = (key: string, field: string, value: any) => {
    setPackages((prev: any) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const onAddPackage = () => {
    const name = window.prompt(t('packages.add_prompt', 'Yeni paket anahtarını girin (örn: premium):'));
    if (!name) return;
    
    const key = name.toLowerCase().replace(/\s+/g, '_');
    if (packages[key]) {
      toast.error(t('packages.errors.already_exists', 'Bu paket anahtarı zaten mevcut.'));
      return;
    }

    setPackages((prev: any) => ({
      ...prev,
      [key]: {
        max_companies: 10,
        max_employees: 100,
        ai_enabled: false,
        white_label: false,
        description_tr: '',
        description_en: '',
        label_tr: name,
        label_en: name
      }
    }));
  };

  const onDeletePackage = (key: string) => {
    if (!window.confirm(t('packages.delete_confirm'))) return;
    
    const newPackages = { ...packages };
    delete newPackages[key];
    setPackages(newPackages);
  };

  const onSave = async () => {
    setLoading(true);
    try {
      await client.put('/admin/settings/packages', packages);
      toast.success(t('settings.packages.save_success'));
      onRefresh();
    } catch (err: any) {
      console.error('[Settings] Packages Update Error:', err);
      toast.error(err.response?.data?.error?.message || t('common.save_error'));
    } finally {
      setLoading(false);
    }
  };

  const packageKeys = Object.keys(packages);

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h3 className="text-2xl font-black text-navy tracking-tight">{t('settings.packages.title')}</h3>
          <p className="text-sm text-slate-500 font-medium">{t('settings.packages.subtitle')}</p>
        </div>
        <div className="flex gap-4">
          <Button variant="secondary" onClick={onAddPackage} className="bg-white border-slate-200 text-slate-600 px-6 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all flex gap-2 items-center">
            <Plus size={18} />
            {t('settings.packages.add')}
          </Button>
          <Button disabled={loading} onClick={onSave} className="premium-gradient text-white px-8 py-2.5 rounded-xl shadow-lg shadow-primary/20 flex gap-2 items-center font-bold tracking-wide">
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {t('common:save_settings')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {packageKeys.map((key) => (
          <Card key={key} className="shadow-xl shadow-slate-200/50 border-slate-100 p-0 overflow-hidden group border-2 hover:border-primary/20 transition-all duration-300">
            <div className={`p-6 border-b border-slate-50 flex items-center justify-between ${
              key === 'starter' ? 'bg-slate-50/50' : 
              key === 'growth' ? 'bg-primary/5' : 
              key === 'enterprise' ? 'bg-navy text-white' : 'bg-slate-100'
            }`}>
              <h4 className="font-black uppercase tracking-widest text-sm">
                {packages[key]?.label_tr || key}
              </h4>
              <div className="flex items-center gap-2">
                {key === 'growth' && <span className="bg-primary text-white text-[10px] font-black px-2 py-1 rounded-lg uppercase">Popüler</span>}
                {!['starter', 'growth', 'enterprise'].includes(key) && (
                  <button 
                    onClick={() => onDeletePackage(key)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <XCircle size={16} />
                  </button>
                )}
              </div>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('settings.packages.label_tr')}</label>
                     <input 
                        className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary focus:bg-white transition-all"
                        value={packages[key]?.label_tr || ''} 
                        onChange={(e) => onUpdatePackage(key, 'label_tr', e.target.value)}
                        placeholder="Örn: Başlangıç"
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('settings.packages.label_en')}</label>
                     <input 
                        className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary focus:bg-white transition-all"
                        value={packages[key]?.label_en || ''} 
                        onChange={(e) => onUpdatePackage(key, 'label_en', e.target.value)}
                        placeholder="Örn: Starter"
                     />
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup 
                    label={t('settings.packages.labels.max_companies')} 
                    type="number" 
                    value={packages[key]?.max_companies || ''} 
                    onChange={(e: any) => onUpdatePackage(key, 'max_companies', e.target.value === '' ? null : parseInt(e.target.value))} 
                  />
                  <InputGroup 
                    label={t('settings.packages.labels.max_employees')} 
                    type="number" 
                    value={packages[key]?.max_employees || ''} 
                    onChange={(e: any) => onUpdatePackage(key, 'max_employees', e.target.value === '' ? null : parseInt(e.target.value))} 
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-[20px] border border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-navy uppercase tracking-widest">{t('settings.packages.labels.ai_enabled')}</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase mt-1">Tam Erişim</span>
                  </div>
                  <button 
                    onClick={() => onUpdatePackage(key, 'ai_enabled', !packages[key]?.ai_enabled)}
                    className={`relative w-14 h-7 rounded-full transition-all duration-300 ${packages[key]?.ai_enabled ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ${packages[key]?.ai_enabled ? 'left-8' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-[20px] border border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-navy uppercase tracking-widest">{t('settings.packages.labels.white_label')}</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase mt-1">Markasız Panel</span>
                  </div>
                  <button 
                    onClick={() => onUpdatePackage(key, 'white_label', !packages[key]?.white_label)}
                    className={`relative w-14 h-7 rounded-full transition-all duration-300 ${packages[key]?.white_label ? 'bg-navy shadow-lg shadow-navy/20' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ${packages[key]?.white_label ? 'left-8' : 'left-1'}`} />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-8 pt-4">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('settings.packages.labels.description')} (TR)</label>
                    <textarea 
                      value={packages[key]?.description_tr || ''} 
                      onChange={(e) => onUpdatePackage(key, 'description_tr', e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-100 rounded-[24px] px-5 py-4 text-sm font-medium outline-none focus:border-primary focus:bg-white transition-all resize-none h-28"
                      placeholder="Türkçe paket açıklaması..."
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('settings.packages.labels.description')} (EN)</label>
                    <textarea 
                      value={packages[key]?.description_en || ''} 
                      onChange={(e) => onUpdatePackage(key, 'description_en', e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-100 rounded-[24px] px-5 py-4 text-sm font-medium outline-none focus:border-primary focus:bg-white transition-all resize-none h-28"
                      placeholder="English package description..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
