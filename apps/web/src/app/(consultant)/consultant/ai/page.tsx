'use client';

import React, { useEffect, useState } from 'react';
import { useT } from '@/hooks/useT';
import {
  Bot,
  Sparkles,
  Brain,
  LineChart,
  Zap,
  ArrowRight,
  MessageSquare,
  Building2,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import client from '@/lib/api/client';
import Link from 'next/link';

const getScoreColor = (score: number | null) => {
  if (!score) return '#94a3b8';
  if (score >= 70) return '#10b981';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
};

export default function ConsultantAIPage() {
  const { t, tc } = useT('consultant');
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<any>(null);

  const currentPeriod = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const compRes = await client.get('/consultant/companies');
        const companiesData = compRes.data?.data || compRes.data || [];
        setCompanies(Array.isArray(companiesData) ? companiesData : []);
        
        try {
          const billRes = await client.get('/consultant/billing/credits');
          const balances = Array.isArray(billRes.data) ? billRes.data : [];
          const aiCredit = balances.find((b: any) => b.key === 'ai_credit');
          setCredits(aiCredit || { balance: 0 });
        } catch (err) {
          setCredits({ balance: 0 });
        }
      } catch (error) {
        console.error('Error fetching data for AI page:', error);
        toast.error('Veriler yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRunAnalysis = async () => {
    if (selectedCompanies.length < 2) {
      toast.error('Lütfen karşılaştırmak için en az 2 firma seçin');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      const response = await client.post('/consultant/ai/comparative-insight', {
        company_ids: selectedCompanies,
        period: currentPeriod,
      });
      setAnalysisResult(response.data.data || response.data);
      toast.success('Analiz başarıyla tamamlandı');
    } catch (err: any) {
      const message = err.response?.data?.error?.message || 'Analiz sırasında bir hata oluştu';
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleCompany = (id: string) => {
    setSelectedCompanies(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <div style={{ height: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <Loader2 className="animate-spin" size={40} style={{ color: '#2563eb' }} />
        <p style={{ color: '#64748b', fontWeight: 500 }}>Veriler hazırlanıyor...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '1100px', margin: '0 auto', fontFamily: '"Outfit", sans-serif' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bot color="#2563eb" /> AI Analiz & Kıyaslama
          </h1>
          <p style={{ color: '#64748b', marginTop: '4px' }}>Firmalar arası verimlilik ve esenlik kıyaslamalarını yapay zeka ile yapın.</p>
        </div>

        {credits && (
          <div style={{ 
            background: '#ffffff', padding: '16px 24px', borderRadius: '24px', 
            border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            display: 'flex', alignItems: 'center', gap: '16px'
          }}>
            <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '14px' }}>
              <Zap color="#2563eb" size={20} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI KREDİSİ</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>{credits.balance} <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>kalan</span></div>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem' }}>
        
        {/* Left Sidebar: Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '32px', padding: '24px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={18} color="#64748b" /> Firma Seçimi
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '450px', overflowY: 'auto', paddingRight: '4px' }}>
              {companies.length > 0 ? (
                companies.map(c => (
                  <div 
                    key={c.id}
                    onClick={() => toggleCompany(c.id)}
                    style={{ 
                      padding: '16px', borderRadius: '18px', cursor: 'pointer', transition: 'all 0.2s',
                      border: selectedCompanies.includes(c.id) ? '2px solid #2563eb' : '1px solid #f1f5f9',
                      background: selectedCompanies.includes(c.id) ? '#eff6ff' : '#f8fafc',
                      position: 'relative'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>{c.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      {c.industry || 'Genel'} · <span style={{ color: getScoreColor(c.wellbeing_score), fontWeight: 600 }}>{c.wellbeing_score || '-'} Skor</span>
                    </div>
                    {selectedCompanies.includes(c.id) && (
                      <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#2563eb' }}>
                        <CheckCircle2 size={18} />
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }}>
                  Analiz edilecek firma bulunamadı.
                </div>
              )}
            </div>

            <button
              onClick={handleRunAnalysis}
              disabled={isAnalyzing || selectedCompanies.length < 2 || credits?.balance === 0}
              style={{ 
                width: '100%', marginTop: '24px', padding: '16px', borderRadius: '18px', border: 'none',
                background: selectedCompanies.length >= 2 ? '#2563eb' : '#f1f5f9',
                color: selectedCompanies.length >= 2 ? '#ffffff' : '#94a3b8',
                fontWeight: 700, fontSize: '15px', cursor: (isAnalyzing || selectedCompanies.length < 2) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                boxShadow: selectedCompanies.length >= 2 ? '0 10px 15px -3px rgba(37, 99, 235, 0.2)' : 'none'
              }}
            >
              {isAnalyzing ? (
                <><Loader2 className="animate-spin" size={18} /> Analiz Ediliyor...</>
              ) : (
                <><Sparkles size={18} /> Analizi Başlat</>
              )}
            </button>
            <p style={{ textAlign: 'center', fontSize: '11px', color: '#94a3b8', marginTop: '12px' }}>
              Minimum 2 firma seçilmelidir. Analiz ⚡ 5 kredi tüketir.
            </p>
          </div>

          <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.6' }}>
              💡 <strong>İpucu:</strong> Daha detaylı ve profesyonel PDF raporları oluşturmak için 
              <Link href="/consultant/reports" style={{ color: '#2563eb', fontWeight: 600, marginLeft: '4px', textDecoration: 'none' }}>
                Raporlar →
              </Link> sekmesini kullanabilirsiniz.
            </p>
          </div>
        </div>

        {/* Right Content: Results */}
        <div style={{ background: '#ffffff', borderRadius: '32px', border: '1px solid #e2e8f0', minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
          {isAnalyzing ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px', padding: '40px' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '24px', border: '4px solid #eff6ff', borderTopColor: '#2563eb' }} className="animate-spin" />
                <Bot style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} color="#2563eb" size={32} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>Yapay Zeka Verileri İşliyor</h3>
                <p style={{ color: '#64748b', marginTop: '8px', maxWidth: '300px' }}>Seçilen firmaların esenlik ve verimlilik skorları karşılaştırılıyor...</p>
              </div>
            </div>
          ) : analysisResult ? (
            <div style={{ padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: '#2563eb', padding: '12px', borderRadius: '16px' }}>
                    <Brain color="#ffffff" size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>Analiz Sonuçları</h3>
                    <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>{currentPeriod} DÖNEMİ KIYASLAMASI</p>
                  </div>
                </div>
                <button 
                  onClick={() => setAnalysisResult(null)}
                  style={{ background: '#f1f5f9', border: 'none', padding: '10px 20px', borderRadius: '12px', color: '#64748b', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                >
                  Yeni Analiz
                </button>
              </div>

              <div style={{ 
                background: '#f8fafc', borderRadius: '24px', padding: '24px', border: '1px solid #f1f5f9',
                color: '#334155', lineHeight: '1.8', fontSize: '15px', whiteSpace: 'pre-wrap'
              }}>
                {typeof analysisResult === 'string' ? analysisResult : analysisResult.ai_suggestion || analysisResult.content || JSON.stringify(analysisResult)}
              </div>

              <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                  <CheckCircle2 color="#10b981" style={{ marginBottom: '12px' }} />
                  <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '14px' }}>Güçlü Yönler</div>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Firmaların ortaklaşa başarılı olduğu alanlar ve pozitif trendler.</p>
                </div>
                <div style={{ padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                  <MessageSquare color="#2563eb" style={{ marginBottom: '12px' }} />
                  <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '14px' }}>Öneriler</div>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Verimliliği artırmak için atılabilecek stratejik adımlar.</p>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', textAlign: 'center' }}>
              <div style={{ width: '80px', height: '80px', background: '#f8fafc', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <LineChart size={40} color="#cbd5e1" />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>Analiz İçin Hazır</h3>
              <p style={{ color: '#64748b', marginTop: '8px', maxWidth: '350px' }}>
                Soldaki listeden karşılaştırmak istediğiniz firmaları seçin ve analizi başlatın.
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '40px', width: '100%', maxWidth: '400px' }}>
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px', textAlign: 'left' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#2563eb', marginBottom: '4px' }}>01</div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#1e293b' }}>Kıyasla</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Sektörel bazda durum tespiti.</div>
                </div>
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px', textAlign: 'left' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#2563eb', marginBottom: '4px' }}>02</div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#1e293b' }}>Keşfet</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Gizli riskleri ve fırsatları gör.</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
