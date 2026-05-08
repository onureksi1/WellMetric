'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import client from '@/lib/api/client';
import { toast } from 'react-hot-toast';
import { 
  FileText, 
  Plus, 
  Bot, 
  Calendar, 
  Building2, 
  Globe, 
  Zap, 
  Clock, 
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Send,
  EyeOff
} from 'lucide-react';

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  draft:      { label: 'Taslak',      color: '#475569', bg: '#f1f5f9', icon: Clock },
  processing: { label: 'Hazırlanıyor', color: '#2563eb', bg: '#eff6ff', icon: Loader2 },
  published:  { label: 'Yayında',     color: '#059669', bg: '#ecfdf5', icon: CheckCircle2 },
  archived:   { label: 'Arşiv',       color: '#94a3b8', bg: '#f8fafc', icon: AlertCircle },
};

const SINGLE_MODELS = [
  {
    key:   'wellbeing_metric',
    name:  'WellBeing Metric',
    badge: 'Varsayılan',
    color: '#1D9E75',
    when:  'Ne zaman seç: Kendi metodolojinle çalışıyorsan. Platform\'un 5 boyutlu çerçevesi — Fiziksel, Zihinsel, Sosyal, Finansal, İş & Anlam.',
    best:  'En iyi: Genel kurumsal wellbeing analizi için.',
  },
  {
    key:   'perma',
    name:  'PERMA (Seligman)',
    badge: 'Akademik',
    color: '#6D28D9',
    when:  'Ne zaman seç: Pozitif psikoloji uzmanıysan veya müşteri akademik çerçeve istiyorsa.',
    best:  'En iyi: Çalışan gelişimi ve flourishing odaklı analizler için.',
  },
  {
    key:   'who5_gallup',
    name:  'WHO-5 + Gallup Q12',
    badge: 'Klinik',
    color: '#1A56DB',
    when:  'Ne zaman seç: Zihinsel sağlık ve iş bağlılığını klinik standartlarda ölçmek istiyorsan.',
    best:  'En iyi: Sağlık sektörü, kamu kurumları veya yüksek stres ortamları için.',
  },
  {
    key:   'cipd',
    name:  'CIPD Workplace',
    badge: 'Kurumsal',
    color: '#B45309',
    when:  'Ne zaman seç: İK odaklı, kurumsal standart rapor gerekiyorsa. Uluslararası şirketler için ideal.',
    best:  'En iyi: İK departmanına sunulacak, politika değişikliği önerecek raporlar için.',
  },
];

const COMBO_MODELS = [
  {
    key:        'perma_who5',
    primary:    'perma',
    reference:  'who5_gallup',
    name:       'PERMA + WHO-5',
    badge:      'Akademik + Klinik',
    color:      '#6D28D9',
    desc:       'Pozitif psikoloji çerçevesi, klinik zihinsel sağlık verileriyle desteklenir.',
    when:       'Ne zaman seç: Hem çalışan gelişimini hem zihinsel sağlığı derinlemesine analiz etmek istiyorsan.',
    best:       'En iyi: Tükenmişlik riski yüksek, yoğun bilişsel çalışma ortamları için.',
    example:    'Örnek: "PERMA\'nın Bağlılık boyutu WHO-5 klinik verileriyle desteklenmektedir."',
  },
  {
    key:        'wm_perma',
    primary:    'wellbeing_metric',
    reference:  'perma',
    name:       'WellBeing Metric + PERMA',
    badge:      'Bütünsel + Akademik',
    color:      '#1D9E75',
    desc:       'Platform\'un 5 boyutlu çerçevesi, Seligman\'ın akademik modeli referans alınarak yorumlanır.',
    when:       'Ne zaman seç: Kendi metodolojini akademik bir çerçeveyle güçlendirmek istiyorsan.',
    best:       'En iyi: Müşteri hem kapsamlı hem akademik referanslı rapor istiyorsa.',
    example:    'Örnek: "Zihinsel boyut, PERMA\'nın Pozitif Duygu ve Bağlılık perspektifinden yorumlanmıştır."',
  },
  {
    key:        'wm_gallup',
    primary:    'wellbeing_metric',
    reference:  'who5_gallup',
    name:       'WellBeing Metric + Gallup Q12',
    badge:      'Bütünsel + Bağlılık',
    color:      '#1D9E75',
    desc:       'Platform çerçevesi, Gallup\'un dünya genelinde kanıtlanmış iş bağlılığı verileriyle zenginleştirilir.',
    when:       'Ne zaman seç: İş bağlılığı düşüklüğü şüphesi varsa veya müşteri Gallup standardını tanıyorsa.',
    best:       'En iyi: Kurumsal satış, büyük holdingler, uluslararası karşılaştırma gerektiğinde.',
    example:    'Örnek: "İş & Anlam boyutu Gallup Q12 endeksiyle karşılaştırmalı olarak değerlendirilmiştir."',
  },
  {
    key:        'cipd_who5',
    primary:    'cipd',
    reference:  'who5_gallup',
    name:       'CIPD + WHO-5',
    badge:      'Kurumsal + Klinik',
    color:      '#B45309',
    desc:       'İK standartları, klinik zihinsel sağlık verileriyle desteklenir.',
    when:       'Ne zaman seç: İK politikası değişikliği önerecek, sağlık odaklı kurumsal rapor gerekiyorsa.',
    best:       'En iyi: Sağlık, finans veya kamu sektöründe İK liderliğine sunulacak raporlar için.',
    example:    'Örnek: "CIPD iş yeri sağlık çerçevesi WHO-5 klinik eşikleriyle desteklenmiştir."',
  },
];

export default function ConsultantReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genForm, setGenForm] = useState({
    company_id: '',
    period: new Date().toISOString().slice(0, 7),
    language: 'tr' as 'tr' | 'en',
  });
  
  const [modelMode, setModelMode]           = useState<'single'|'combo'|'custom'>('single');
  const [singleModel, setSingleModel]       = useState('wellbeing_metric');
  const [primaryModel, setPrimaryModel]     = useState('wellbeing_metric');
  const [referenceModel, setReferenceModel] = useState('');
  const [selectedCombo, setSelectedCombo]   = useState('wm_gallup');

  const getSelectedModels = () => {
    if (modelMode === 'single') {
      return { primary: singleModel, reference: null };
    }
    if (modelMode === 'combo') {
      const combo = COMBO_MODELS.find(c => c.key === selectedCombo);
      return { primary: combo?.primary ?? 'wellbeing_metric',
               reference: combo?.reference ?? null };
    }
    // custom
    return { primary: primaryModel, reference: referenceModel || null };
  };

  const fetchData = async () => {
    try {
      const [rRes, cRes] = await Promise.all([
        client.get('/consultant/reports'),
        client.get('/consultant/companies'),
      ]);
      setReports(Array.isArray(rRes.data?.data || rRes.data) ? (rRes.data?.data || rRes.data) : []);
      setCompanies(Array.isArray(cRes.data?.data || cRes.data) ? (cRes.data?.data || cRes.data) : []);
    } catch (err) {
      console.error('Veri yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Firma seçilince (varsayılanı ata)
  useEffect(() => {
    if (!genForm.company_id) return;
    const company = companies.find(c => c.id === genForm.company_id);
    if (company) {
      setSingleModel(company.assessment_model || 'wellbeing_metric');
      setPrimaryModel(company.assessment_model || 'wellbeing_metric');
    }
  }, [genForm.company_id, companies]);

  // Polling for processing reports
  useEffect(() => {
    let interval: any;
    if (reports.some(r => r.status === 'processing')) {
      interval = setInterval(() => {
        fetchData();
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [reports]);

  const handleGenerate = async () => {
    if (!genForm.company_id) { toast.error('Lütfen bir firma seçin'); return; }
    setGenerating(true);
    const { primary, reference } = getSelectedModels();
    try {
      await client.post('/consultant/reports/generate', {
        ...genForm,
        assessment_model: primary,
        reference_assessment_model: reference,
      });
      setModal(false);
      toast.success('Rapor talebi alındı. Hazırlandığında e-posta ile bildireceğiz.', { duration: 5000 });
      fetchData(); // Listeyi yenile (mevcutları görsün)
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Rapor talebi iletilemedi');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Bu raporu silmek istediğinize emin misiniz?')) return;
    
    try {
      await client.delete(`/consultant/reports/${id}`);
      toast.success('Rapor başarıyla silindi');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Rapor silinemedi');
    }
  };

  const handlePublish = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await client.post(`/consultant/reports/${id}/publish`);
      toast.success('Rapor başarıyla yayınlandı');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Rapor yayınlanamadı');
    }
  };

  const handleUnpublish = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await client.post(`/consultant/reports/${id}/unpublish`);
      toast.success('Rapor yayından kaldırıldı');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'İşlem başarısız');
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh', padding: '2rem 1.5rem', background: '#fcfcfd', fontFamily: '"Outfit", sans-serif' }}>
      
      {/* Header Section */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Raporlarım & Arşiv</h1>
          <p style={{ color: '#64748b', marginTop: '6px', fontSize: '16px' }}>Oluşturduğunuz tüm analiz raporlarını buradan yönetebilir ve takip edebilirsiniz.</p>
        </div>
        <button 
          onClick={() => setModal(true)}
          style={{ 
            background: '#2563eb', color: '#ffffff', padding: '14px 28px', 
            borderRadius: '16px', border: 'none', fontWeight: 700, fontSize: '15px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
            boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.2)', transition: 'all 0.2s'
          }}
        >
          <Bot size={20} /> <span>Yeni AI Rapor</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
          <Clock size={20} color="#64748b" />
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', margin: 0 }}>Rapor Arşivi</h2>
        </div>

        {loading ? (
          <div style={{ padding: '100px', textAlign: 'center' }}>
            <Loader2 className="animate-spin" size={40} color="#2563eb" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: '#64748b', fontWeight: 500 }}>Raporlar listeleniyor...</p>
          </div>
        ) : reports.length === 0 ? (
          <div style={{ 
            padding: '100px 40px', textAlign: 'center', background: '#ffffff', 
            borderRadius: '32px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ width: '80px', height: '80px', background: '#f8fafc', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <FileText size={40} color="#cbd5e1" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>Henüz Rapor Oluşturulmadı</h3>
            <p style={{ color: '#64748b', marginBottom: '32px', maxWidth: '400px', margin: '12px auto 32px' }}>
              Firmalarınızın verilerini yapay zeka ile analiz ederek dakikalar içinde profesyonel raporlar hazırlayabilirsiniz.
            </p>
            <button 
              onClick={() => setModal(true)}
              style={{ 
                padding: '14px 32px', borderRadius: '16px', border: '1px solid #e2e8f0', 
                background: '#ffffff', fontWeight: 700, cursor: 'pointer', fontSize: '14px',
                color: '#1e293b', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
              }}
            >
              İlk Raporu Şimdi Oluştur
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {reports.map((report) => {
              const status = STATUS_LABELS[report.status] || STATUS_LABELS.draft;
              const StatusIcon = status.icon;
              
              return (
                <div 
                  key={report.id} 
                  style={{ 
                    background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '24px', 
                    padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)', transition: 'all 0.2s, box-shadow 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.02)';
                  }}
                  onClick={() => router.push(`/consultant/reports/${report.id}/edit`)}
                >
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ 
                      width: '56px', height: '56px', background: '#f8fafc', borderRadius: '16px', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center' 
                    }}>
                      <FileText size={24} color="#64748b" />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 700, fontSize: '17px', color: '#1e293b' }}>{report.title}</span>
                        <div style={{ 
                          display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', 
                          padding: '4px 10px', borderRadius: '8px', fontWeight: 800,
                          color: status.color, background: status.bg, textTransform: 'uppercase'
                        }}>
                          <StatusIcon size={12} className={report.status === 'processing' ? 'animate-spin' : ''} /> {status.label}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Building2 size={14} /> {report.company?.name}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} /> {report.period}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} /> {new Date(report.createdAt || report.created_at).toLocaleDateString('tr-TR')}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {report.status === 'draft' && (
                      <button
                        onClick={(e) => handlePublish(e, report.id)}
                        title="Yayınla"
                        style={{
                          padding: '10px', borderRadius: '12px', border: 'none', background: '#f0fdf4',
                          color: '#16a34a', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#dcfce7'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#f0fdf4'}
                      >
                        <Send size={18} />
                      </button>
                    )}
                    {report.status === 'published' && (
                      <button
                        onClick={(e) => handleUnpublish(e, report.id)}
                        title="Yayından Kaldır"
                        style={{
                          padding: '10px', borderRadius: '12px', border: 'none', background: '#fef2f2',
                          color: '#991b1b', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#fef2f2'}
                      >
                        <EyeOff size={18} />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(e, report.id)}
                      title="Sil"
                      style={{
                        padding: '10px', borderRadius: '12px', border: 'none', background: '#fff1f2',
                        color: '#e11d48', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#ffe4e6'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#fff1f2'}
                    >
                      <Trash2 size={18} />
                    </button>
                    <ChevronRight size={20} color="#cbd5e1" style={{ marginLeft: '4px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Report Wizard Modal */}
      {modal && (
        <div style={{ 
          position: 'fixed', inset: 0, zIndex: 99999, 
          background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{ 
            background: '#ffffff', width: '100%', maxWidth: '520px', borderRadius: '32px',
            overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            display: 'flex', flexDirection: 'column', position: 'relative'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '32px 32px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.02em' }}>AI Rapor Sihirbazı</h2>
                <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Firma verilerini analiz ederek kapsamlı rapor üretir.</p>
              </div>
              <button 
                onClick={() => setModal(false)} 
                style={{ background: '#f8fafc', border: 'none', width: '40px', height: '40px', borderRadius: '12px', cursor: 'pointer', color: '#94a3b8', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '32px', overflowY: 'auto', maxHeight: '65vh' }}>
              
              {/* Company Selection */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: '#1e293b' }}>Hangi firma için rapor üretilecek?</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {companies.map(c => (
                    <div 
                      key={c.id} 
                      onClick={() => setGenForm({...genForm, company_id: c.id})}
                      style={{ 
                        padding: '16px', borderRadius: '18px', cursor: 'pointer', transition: 'all 0.2s',
                        border: genForm.company_id === c.id ? '2px solid #2563eb' : '1px solid #e2e8f0',
                        background: genForm.company_id === c.id ? '#eff6ff' : '#ffffff'
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b' }}>{c.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', display: 'flex', gap: '10px' }}>
                        <span>{c.industry || 'Genel'}</span>
                        <span>•</span>
                        <span>{c.employee_count} çalışan</span>
                      </div>
                    </div>
                  ))}
                  {companies.length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', background: '#f8fafc', borderRadius: '18px', border: '1px dashed #e2e8f0' }}>
                      Henüz firma eklenmemiş.
                    </div>
                  )}
                </div>
              </div>

              {/* Parameters */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '8px', color: '#1e293b' }}>Rapor Dönemi</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="month" 
                      value={genForm.period} 
                      onChange={e => setGenForm({...genForm, period: e.target.value})} 
                      style={{ 
                        width: '100%', padding: '14px 14px 14px 40px', borderRadius: '14px', 
                        border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', background: '#ffffff' 
                      }} 
                    />
                    <Calendar size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '8px', color: '#1e293b' }}>Rapor Dili</label>
                  <div style={{ position: 'relative' }}>
                    <select 
                      value={genForm.language} 
                      onChange={e => setGenForm({...genForm, language: e.target.value as any})} 
                      style={{ 
                        width: '100%', padding: '14px 14px 14px 40px', borderRadius: '14px', 
                        border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', background: '#ffffff', appearance: 'none' 
                      }}
                    >
                      <option value="tr">Türkçe</option>
                      <option value="en">English</option>
                    </select>
                    <Globe size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>
              </div>

              {/* Assessment Model Selection */}
              <div style={{ marginBottom:16 }}>
                <label style={{
                  fontSize:11, fontWeight:700,
                  color:'var(--color-text-secondary)',
                  display:'block', marginBottom:4,
                  letterSpacing:'.07em',
                }}>
                  DEĞERLENDİRME MODELİ *
                </label>

                {/* ── MOD SEÇİCİ ── */}
                <div style={{
                  display:'grid', gridTemplateColumns:'1fr 1fr 1fr',
                  gap:6, marginBottom:14,
                }}>
                  {[
                    { key:'single', label:'Tek Ölçek',     icon:'🎯' },
                    { key:'combo',  label:'Kombinasyon',   icon:'🔗' },
                    { key:'custom', label:'Özel Seçim',    icon:'⚙️' },
                  ].map(mode => (
                    <button key={mode.key}
                      type="button"
                      onClick={() => setModelMode(mode.key as any)}
                      style={{
                        padding:'8px 6px',
                        border: modelMode === mode.key
                          ? '2px solid #2563eb'
                          : '1.5px solid #e2e8f0',
                        borderRadius:'12px',
                        background: modelMode === mode.key
                          ? '#eff6ff'
                          : '#ffffff',
                        cursor:'pointer', fontSize:12, fontWeight:700,
                        color: modelMode === mode.key
                          ? '#2563eb'
                          : '#64748b',
                        display:'flex', flexDirection:'column',
                        alignItems:'center', gap:3,
                        transition: 'all 0.15s'
                      }}>
                      <span style={{ fontSize: 16 }}>{mode.icon}</span>
                      <span>{mode.label}</span>
                    </button>
                  ))}
                </div>

                {/* ── TEK ÖLÇEK ── */}
                {modelMode === 'single' && (
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {SINGLE_MODELS.map(model => (
                      <div key={model.key}
                        onClick={() => setSingleModel(model.key)}
                        style={{
                          border: singleModel === model.key
                            ? `2px solid ${model.color}`
                            : '1.5px solid #e2e8f0',
                          borderRadius:'16px',
                          overflow:'hidden',
                          cursor:'pointer',
                          transition:'all .15s',
                        }}>
                        {/* Üst satır */}
                        <div style={{
                          display:'flex', alignItems:'center', gap:10,
                          padding:'10px 12px',
                          background: singleModel === model.key
                            ? `${model.color}10`
                            : '#ffffff',
                        }}>
                          <div style={{
                            width:16, height:16, borderRadius:'50%', flexShrink:0,
                            border: singleModel === model.key
                              ? `5px solid ${model.color}`
                              : '1.5px solid #e2e8f0',
                            transition:'all .15s',
                          }} />
                          <span style={{ fontSize:13, fontWeight:700, flex:1, color: '#1e293b' }}>
                            {model.name}
                          </span>
                          <span style={{
                            fontSize:10, padding:'2px 7px', borderRadius:4,
                            fontWeight:700,
                            background: singleModel === model.key
                              ? `${model.color}20` : '#f1f5f9',
                            color: singleModel === model.key
                              ? model.color : '#64748b',
                          }}>
                            {model.badge}
                          </span>
                        </div>

                        {/* Açıklama — seçilince açılır */}
                        {singleModel === model.key && (
                          <div style={{
                            padding:'10px 12px 12px',
                            borderTop:`1px solid ${model.color}20`,
                            background:`${model.color}05`,
                          }}>
                            <div style={{
                              fontSize:11, color:'#475569',
                              lineHeight:1.6, marginBottom:6,
                            }}>
                              <span style={{ fontWeight:700 }}>📌 </span>
                              {model.when}
                            </div>
                            <div style={{
                              fontSize:11, color:`${model.color}`,
                              fontWeight:700,
                            }}>
                              <span>✓ </span>{model.best}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* ── KOMBİNASYON ── */}
                {modelMode === 'combo' && (
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {COMBO_MODELS.map(combo => (
                      <div key={combo.key}
                        onClick={() => setSelectedCombo(combo.key)}
                        style={{
                          border: selectedCombo === combo.key
                            ? `2px solid ${combo.color}`
                            : '1.5px solid #e2e8f0',
                          borderRadius:'16px',
                          overflow:'hidden',
                          cursor:'pointer',
                          transition:'all .15s',
                        }}>
                        {/* Üst satır */}
                        <div style={{
                          display:'flex', alignItems:'center', gap:10,
                          padding:'10px 12px',
                          background: selectedCombo === combo.key
                            ? `${combo.color}10`
                            : '#ffffff',
                        }}>
                          <div style={{
                            width:16, height:16, borderRadius:'50%', flexShrink:0,
                            border: selectedCombo === combo.key
                              ? `5px solid ${combo.color}`
                              : '1.5px solid #e2e8f0',
                            transition:'all .15s',
                          }} />
                          <div style={{ flex:1 }}>
                            <div style={{
                              fontSize:13, fontWeight:700, marginBottom:2, color: '#1e293b'
                            }}>
                              {combo.name}
                            </div>
                            <div style={{
                              fontSize:11, color:'#64748b',
                            }}>
                              {combo.desc}
                            </div>
                          </div>
                          <span style={{
                            fontSize:10, padding:'2px 7px', borderRadius:4,
                            fontWeight:700, flexShrink:0,
                            background: selectedCombo === combo.key
                              ? `${combo.color}20`
                              : '#f1f5f9',
                            color: selectedCombo === combo.key
                              ? combo.color : '#64748b',
                          }}>
                            {combo.badge}
                          </span>
                        </div>

                        {/* Açıklama — seçilince açılır */}
                        {selectedCombo === combo.key && (
                          <div style={{
                            padding:'10px 12px 12px',
                            borderTop:`1px solid ${combo.color}20`,
                            background:`${combo.color}05`,
                          }}>
                            <div style={{
                              fontSize:11, color:'#475569',
                              lineHeight:1.6, marginBottom:4,
                            }}>
                              <span style={{ fontWeight:700 }}>📌 </span>
                              {combo.when}
                            </div>
                            <div style={{
                              fontSize:11, color:`${combo.color}`,
                              fontWeight:700, marginBottom:4,
                            }}>
                              <span>✓ </span>{combo.best}
                            </div>
                            <div style={{
                              fontSize:11,
                              color:'#94a3b8',
                              fontStyle:'italic',
                            }}>
                              {combo.example}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* ── ÖZEL SEÇİM ── */}
                {modelMode === 'custom' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{
                      fontSize:11, color:'#64748b',
                      lineHeight:1.5,
                      padding:'8px 12px',
                      background:'#f8fafc',
                      borderRadius:'12px',
                      border: '1px solid #f1f5f9'
                    }}>
                      ⚙️ Uzman modu: Ana ve referans modeli kendiniz seçin.
                      Yalnızca birbirini destekleyen ölçekler anlamlı sonuç verir.
                    </div>

                    {/* Ana model */}
                    <div>
                      <div style={{ fontSize:11, fontWeight:700,
                        color:'#64748b', marginBottom:8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        ANA MODEL *
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                        {SINGLE_MODELS.map(model => (
                          <div key={model.key}
                            onClick={() => {
                              setPrimaryModel(model.key);
                              if (referenceModel === model.key) {
                                setReferenceModel('');
                              }
                            }}
                            style={{
                              display:'flex', alignItems:'center', gap:8,
                              padding:'10px 12px',
                              border: primaryModel === model.key
                                ? `2px solid ${model.color}`
                                : '1.5px solid #e2e8f0',
                              borderRadius:'12px',
                              cursor:'pointer',
                              background: primaryModel === model.key
                                ? `${model.color}05`
                                : '#ffffff',
                              transition: 'all 0.15s'
                            }}>
                            <div style={{
                              width:14, height:14, borderRadius:'50%', flexShrink:0,
                              border: primaryModel === model.key
                                ? `4px solid ${model.color}`
                                : '1.5px solid #e2e8f0',
                            }} />
                            <span style={{ fontSize:13, fontWeight:600, color: '#1e293b' }}>
                              {model.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Referans model */}
                    <div>
                      <div style={{ fontSize:11, fontWeight:700,
                        color:'#64748b', marginBottom:8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        REFERANS MODEL <span style={{ fontWeight:400, color:'#94a3b8' }}>(opsiyonel)</span>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                        <div onClick={() => setReferenceModel('')}
                          style={{
                            display:'flex', alignItems:'center', gap:8,
                            padding:'10px 12px',
                            border: referenceModel === ''
                              ? '2px solid #64748b'
                              : '1.5px solid #e2e8f0',
                            borderRadius:'12px',
                            cursor:'pointer',
                            background: referenceModel === '' ? '#f8fafc' : '#ffffff',
                          }}>
                          <div style={{
                            width:14, height:14, borderRadius:'50%', flexShrink:0,
                            border: referenceModel === ''
                              ? '4px solid #64748b'
                              : '1.5px solid #e2e8f0',
                          }} />
                          <span style={{ fontSize:13, fontWeight: 500, color: '#475569' }}>
                            Referans model kullanma
                          </span>
                        </div>
                        {SINGLE_MODELS.filter(m => m.key !== primaryModel).map(model => (
                          <div key={model.key}
                            onClick={() => setReferenceModel(model.key)}
                            style={{
                              display:'flex', alignItems:'center', gap:8,
                              padding:'10px 12px',
                              border: referenceModel === model.key
                                ? `2px solid ${model.color}`
                                : '1.5px solid #e2e8f0',
                              borderRadius:'12px',
                              cursor:'pointer',
                              background: referenceModel === model.key
                                ? `${model.color}05`
                                : '#ffffff',
                            }}>
                            <div style={{
                              width:14, height:14, borderRadius:'50%', flexShrink:0,
                              border: referenceModel === model.key
                                ? `4px solid ${model.color}`
                                : '1.5px solid #e2e8f0',
                            }} />
                            <span style={{ fontSize:13, fontWeight:600, color: '#1e293b' }}>
                              {model.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── SEÇİM ÖZETİ ── */}
                {(() => {
                  const { primary, reference } = getSelectedModels();
                  const pName = SINGLE_MODELS.find(m => m.key === primary)?.name ?? primary;
                  const rName = reference
                    ? SINGLE_MODELS.find(m => m.key === reference)?.name
                    : null;
                  return (
                    <div style={{
                      marginTop:20, padding:'12px 16px',
                      background:'#f8fafc',
                      borderRadius:'16px',
                      fontSize:12,
                      border: '1px solid #f1f5f9'
                    }}>
                      <span style={{ fontWeight:700, color:'#64748b' }}>
                        Seçilen metodoloji:{' '}
                      </span>
                      <span style={{ fontWeight:700, color:'#1e293b' }}>
                        {pName}
                      </span>
                      {rName && (
                        <>
                          <span style={{ margin:'0 6px', color:'#cbd5e1' }}>+</span>
                          <span style={{ fontWeight:700, color:'#059669' }}>
                            {rName} referanslı
                          </span>
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div style={{ 
                background: '#fff7ed', padding: '16px', borderRadius: '16px', border: '1px solid #ffedd5',
                display: 'flex', gap: '12px', alignItems: 'flex-start'
              }}>
                <Zap size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={{ margin: 0, fontSize: '12.5px', color: '#9a3412', lineHeight: '1.5' }}>
                  Bu işlem <strong>20 AI kredisi</strong> kullanacaktır. Analiz süreci arka planda gerçekleştirilecek ve bittiğinde kayıtlı e-posta adresinize bir bildirim gönderilecektir.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '24px 32px 32px', background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
              <button 
                onClick={handleGenerate}
                disabled={generating || !genForm.company_id}
                style={{ 
                  width: '100%', padding: '16px', borderRadius: '18px', border: 'none',
                  background: (generating || !genForm.company_id) ? '#cbd5e1' : '#2563eb', 
                  color: '#ffffff', fontWeight: 800, fontSize: '16px', 
                  cursor: (generating || !genForm.company_id) ? 'not-allowed' : 'pointer',
                  boxShadow: (generating || !genForm.company_id) ? 'none' : '0 10px 15px -3px rgba(37, 99, 235, 0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                  transition: 'all 0.2s'
                }}
              >
                {generating ? (
                  <><Loader2 className="animate-spin" size={20} /> Analiz Ediliyor...</>
                ) : (
                  <>Raporu Şimdi Oluştur</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
