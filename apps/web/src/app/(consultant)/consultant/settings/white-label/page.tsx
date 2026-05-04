'use client';

import React, { useState, useEffect } from 'react';
import { 
  Palette, 
  Globe, 
  Image as ImageIcon, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Trash2,
  Copy,
  Eye,
  Info
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'react-hot-toast';
import client from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';

export default function WhiteLabelPage() {
  const router = useRouter();
  const [config, setConfig] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  
  const [brandName, setBrandName] = useState('');
  const [brandColor, setBrandColor] = useState('#2E865A');
  const [domain, setDomain] = useState('');
  const [dnsInstructions, setDnsInstructions] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [wlRes, settingsRes] = await Promise.all([
        client.get('/consultant/white-label'),
        client.get('/consultant/settings'), // Assuming this endpoint gives plan info
      ]);
      
      const wlData = wlRes.data.data;
      setConfig(wlData);
      setPlan(settingsRes.data.data.plan);
      
      setBrandName(wlData?.brand_name || '');
      setBrandColor(wlData?.brand_color || '#2E865A');
      setDomain(wlData?.custom_domain || '');
    } catch (error) {
      console.error('Fetch error', error);
      toast.error('Veriler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBranding = async () => {
    setSaving(true);
    try {
      await client.put('/consultant/white-label/branding', {
        brand_name: brandName,
        brand_color: brandColor,
      });
      toast.success('Marka bilgileri güncellendi.');
      fetchData();
    } catch (error) {
      toast.error('Güncelleme başarısız.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const endpoint = type === 'logo' ? '/consultant/white-label/logo' : '/consultant/white-label/favicon';
    
    try {
      toast.loading(`${type === 'logo' ? 'Logo' : 'Favicon'} yükleniyor...`);
      await client.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.dismiss();
      toast.success('Başarıyla yüklendi.');
      fetchData();
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.response?.data?.message || 'Yükleme başarısız.');
    }
  };

  const handleSetDomain = async () => {
    try {
      const res = await client.post('/consultant/white-label/domain', { domain });
      setDnsInstructions(res.data.instructions);
      toast.success('Domain kaydedildi. DNS doğrulaması bekleniyor.');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Domain kaydedilemedi.');
    }
  };

  const handleVerifyDomain = async () => {
    setVerifying(true);
    try {
      const res = await client.post('/consultant/white-label/domain/verify');
      if (res.data.verified) {
        toast.success('Domain başarıyla doğrulandı!');
        setDnsInstructions(null);
        fetchData();
      } else {
        toast.error('DNS kaydı bulunamadı. Lütfen biraz bekleyip tekrar deneyin.');
      }
    } catch (error) {
      toast.error('Doğrulama sırasında hata oluştu.');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) return (
    <div className="p-8 space-y-8">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Skeleton className="h-96 rounded-3xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    </div>
  );

  if (!plan?.white_label) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-white border border-slate-100 rounded-[32px] shadow-sm">
        <div className="h-20 w-20 bg-primary/5 text-primary rounded-3xl flex items-center justify-center mb-6">
          <Palette size={40} />
        </div>
        <h2 className="text-2xl font-black text-navy mb-2">White-label Enterprise Plana Özel</h2>
        <p className="text-slate-500 max-w-md mb-8">
          Platformu kendi logonuz, renkleriniz ve alan adınızla kullanmak için Enterprise plana geçiş yapmalısınız.
        </p>
        <Button 
          size="lg" 
          onClick={() => router.push('/consultant/billing?tab=upgrade')}
          className="rounded-2xl px-8"
        >
          Planı Yükselt
          <ExternalLink size={18} className="ml-2" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <div>
        <h1 className="text-3xl font-black text-navy flex items-center gap-3">
          <Palette className="text-primary" size={32} />
          White-label Ayarları
        </h1>
        <p className="text-slate-500 font-medium">Platformu kendi markanızla kişiselleştirin.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Forms */}
        <div className="lg:col-span-7 space-y-8">
          {/* Brand Info */}
          <Card className="p-8 border-none shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-navy flex items-center gap-2 border-b border-slate-50 pb-4">
              <ImageIcon size={20} className="text-primary" />
              Marka Bilgileri
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Platform Adı</label>
                <input 
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Örn: MyWellbeing"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-bold text-navy outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Marka Rengi</label>
                <div className="flex gap-4">
                  <input 
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="h-12 w-20 rounded-xl border-none cursor-pointer overflow-hidden p-0"
                  />
                  <input 
                    type="text"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-mono font-bold text-navy outline-none"
                  />
                </div>
              </div>

              <Button 
                onClick={handleSaveBranding} 
                disabled={saving}
                className="w-full h-12 rounded-2xl shadow-lg shadow-primary/20"
              >
                {saving ? <Loader2 className="animate-spin" /> : 'Değişiklikleri Kaydet'}
              </Button>
            </div>
          </Card>

          {/* Logo & Favicon */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="p-8 border-none shadow-sm space-y-6">
              <h3 className="text-sm font-bold text-navy flex items-center gap-2">Logo</h3>
              <div className="relative group">
                <div className="h-32 w-full border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center bg-slate-50 group-hover:bg-slate-100 transition-colors relative overflow-hidden">
                  {config?.brand_logo_url ? (
                    <img src={config.brand_logo_url} className="h-16 object-contain" />
                  ) : (
                    <div className="text-center">
                      <ImageIcon size={24} className="text-slate-300 mx-auto mb-2" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Logo Yükle</span>
                    </div>
                  )}
                  <input 
                    type="file" 
                    onChange={(e) => handleUpload(e, 'logo')}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    accept="image/*"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">PNG, SVG veya WebP. Max 2MB.</p>
            </Card>

            <Card className="p-8 border-none shadow-sm space-y-6">
              <h3 className="text-sm font-bold text-navy flex items-center gap-2">Favicon</h3>
              <div className="relative group">
                <div className="h-32 w-full border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center bg-slate-50 group-hover:bg-slate-100 transition-colors relative overflow-hidden">
                  {config?.brand_favicon_url ? (
                    <img src={config.brand_favicon_url} className="h-10 w-10 object-contain" />
                  ) : (
                    <div className="text-center">
                      <ImageIcon size={24} className="text-slate-300 mx-auto mb-2" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Favicon Yükle</span>
                    </div>
                  )}
                  <input 
                    type="file" 
                    onChange={(e) => handleUpload(e, 'favicon')}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    accept="image/*"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">16x16 veya 32x32 PNG/ICO önerilir.</p>
            </Card>
          </div>

          {/* Custom Domain */}
          <Card className="p-8 border-none shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-navy flex items-center gap-2 border-b border-slate-50 pb-4">
              <Globe size={20} className="text-primary" />
              Özel Alan Adı (Custom Domain)
            </h3>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <input 
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="consultant.sirketiniz.com"
                  className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-bold text-navy outline-none focus:ring-2 focus:ring-primary/20"
                />
                <Button onClick={handleSetDomain} variant="outline" className="rounded-2xl px-6 h-12 border-slate-200 font-bold">Kaydet</Button>
              </div>

              {config?.custom_domain && (
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <Globe size={18} className="text-slate-400" />
                    <span className="text-sm font-bold text-navy">{config.custom_domain}</span>
                  </div>
                  {config.is_domain_verified ? (
                    <Badge className="bg-green-100 text-green-600 border-none font-black text-[10px] px-3 py-1">DOĞRULANDI</Badge>
                  ) : (
                    <div className="flex gap-2">
                       <Badge className="bg-orange-100 text-orange-600 border-none font-black text-[10px] px-3 py-1">BEKLİYOR</Badge>
                       <Button size="sm" onClick={handleVerifyDomain} disabled={verifying} className="h-7 text-[10px] font-black rounded-lg">
                         {verifying ? <Loader2 className="animate-spin" size={12} /> : 'ŞİMDİ DOĞRULA'}
                       </Button>
                    </div>
                  )}
                </div>
              )}

              {dnsInstructions && (
                <div className="p-6 bg-navy text-white rounded-3xl space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Info size={80} />
                  </div>
                  <h4 className="text-sm font-bold flex items-center gap-2">
                    <Info size={16} /> DNS Talimatları
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Alan adınızı doğrulamak için DNS yöneticinizde aşağıdaki TXT kaydını oluşturun:
                  </p>
                  <div className="bg-white/5 p-4 rounded-xl space-y-3 border border-white/10">
                     <div className="flex justify-between items-center text-[10px] font-black tracking-widest text-slate-500 uppercase">
                       <span>Kayıt Tipi</span>
                       <span>Değer</span>
                     </div>
                     <div className="flex justify-between items-center">
                       <span className="text-xs font-bold text-primary">TXT</span>
                       <code className="text-xs font-mono bg-white/10 px-2 py-1 rounded select-all">{dnsInstructions.record_value}</code>
                     </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Live Preview */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2 flex items-center gap-2">
              <Eye size={14} /> Canlı Önizleme
            </h3>
            
            <div className="bg-slate-200 p-8 rounded-[40px] shadow-inner">
               {/* Mock Header */}
               <div className="bg-white rounded-3xl shadow-xl overflow-hidden min-h-[400px] flex flex-col">
                  <header className="h-16 border-b border-slate-50 flex items-center justify-between px-6 bg-white">
                    <div className="flex items-center gap-3">
                      {config?.brand_logo_url ? (
                        <img src={config.brand_logo_url} className="h-8 object-contain" />
                      ) : (
                        <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-black text-lg shadow-sm" style={{ backgroundColor: brandColor }}>
                          {brandName ? brandName[0] : 'W'}
                        </div>
                      )}
                      <span className="text-sm font-black text-navy">{brandName || 'Platform Adı'}</span>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-slate-50 border border-slate-100" />
                  </header>

                  <div className="p-8 flex-1 space-y-6">
                    <div className="h-8 w-1/2 bg-slate-50 rounded-xl" />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-24 bg-slate-50 rounded-2xl border border-slate-100" />
                      <div className="h-24 bg-slate-50 rounded-2xl border border-slate-100" />
                    </div>
                    
                    {/* Mock Button with dynamic color */}
                    <div className="pt-8">
                       <div 
                         className="h-12 w-full rounded-2xl flex items-center justify-center text-white text-sm font-black shadow-lg"
                         style={{ backgroundColor: brandColor, boxShadow: `0 10px 20px -5px ${brandColor}40` }}
                       >
                         Aksiyon Al
                       </div>
                    </div>
                  </div>
               </div>
            </div>
            
            <p className="text-[10px] text-slate-400 text-center italic">
              * Önizleme yaklaşık görünümü yansıtır. Gerçek görünüm tarayıcı başlığı ve faviconda da uygulanır.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
