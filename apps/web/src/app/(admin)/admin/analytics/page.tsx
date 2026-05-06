'use client';

import React, { useEffect, useState } from 'react';
import client from '@/lib/api/client';

const AiCostDashboard = () => {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await client.get('/admin/analytics/ai-costs/summary');
        const d = res.data;
        setSummary(d.data ?? d);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
      Yükleniyor...
    </div>
  );
  
  if (error) return (
    <div style={{ padding: 24, color: 'var(--color-text-danger)' }}>
      Hata: {error}
    </div>
  );

  if (!summary) return null;

  const s = summary.summary;

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 20, fontWeight: 500, marginBottom: 24, color: 'var(--color-text-primary)' }}>
        AI Maliyet Analizi — Bu Ay
      </h2>

      {/* Özet kartlar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 32 }}>

        <div style={{ 
          background: 'var(--color-background-primary)',
          border: '1px solid var(--color-border-secondary)',
          borderRadius: '12px', 
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Gerçek Maliyet (USD)
          </div>
          <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--color-text-danger)' }}>
            ${Number(s.total_cost_usd).toFixed(2)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
            ≈ {Number(s.total_cost_try).toLocaleString('tr-TR')} ₺
          </div>
        </div>

        <div style={{ 
          background: 'var(--color-background-primary)',
          border: '1px solid var(--color-border-secondary)',
          borderRadius: '12px', 
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Kredi Geliri (TRY)
          </div>
          <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--color-text-success)' }}>
            {Number(s.total_revenue_try).toLocaleString('tr-TR')} ₺
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
            Consultant harcamaları
          </div>
        </div>

        <div style={{ 
          background: 'var(--color-background-primary)',
          border: '1px solid var(--color-border-secondary)',
          borderRadius: '12px', 
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Brüt Kâr (TRY)
          </div>
          <div style={{ 
            fontSize: 28, 
            fontWeight: 600, 
            color: Number(s.gross_margin_try) > 0 ? 'var(--color-text-success)' : 'var(--color-text-danger)' 
          }}>
            {Number(s.gross_margin_try).toLocaleString('tr-TR')} ₺
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
            Net platform kârı
          </div>
        </div>

        <div style={{ 
          background: 'var(--color-background-primary)',
          border: '1px solid var(--color-border-secondary)',
          borderRadius: '12px', 
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Kâr Marjı
          </div>
          <div style={{ 
            fontSize: 28, 
            fontWeight: 600, 
            color: Number(s.margin_percent) > 50 ? 'var(--color-text-success)' : 'var(--color-text-warning)' 
          }}>
            %{s.margin_percent}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
            {Number(s.call_count).toLocaleString('tr-TR')} AI çağrısı
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
        {/* Model bazlı tablo */}
        <div style={{ 
          background: 'var(--color-background-primary)',
          border: '1px solid var(--color-border-secondary)',
          borderRadius: '12px', 
          overflow: 'hidden'
        }}>
          <div style={{ padding: '16px 20px', fontWeight: 500, borderBottom: '1px solid var(--color-border-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Model Bazlı Maliyet</span>
            <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', fontWeight: 400 }}>USD/TRY Kur: {s.usd_try_rate?.toFixed(2) || '—'}</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--color-background-secondary)' }}>
                  {['Model', 'Çağrı', 'Token', 'Maliyet (USD)', 'Gelir (TRY)', 'Marj'].map(h => (
                    <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 500, color: 'var(--color-text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(summary.by_model ?? []).map((row: any, idx: number) => {
                  const costTry = row.total_cost_usd * (s.usd_try_rate || 34);
                  const margin = row.total_revenue_try > 0
                    ? ((1 - costTry / row.total_revenue_try) * 100).toFixed(0)
                    : '—';
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--color-border-secondary)' }}>
                      <td style={{ padding: '12px 20px' }}>
                        <div style={{ fontWeight: 500 }}>{row.model}</div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', textTransform: 'capitalize' }}>
                          {row.provider}
                        </div>
                      </td>
                      <td style={{ padding: '12px 20px' }}>{Number(row.call_count).toLocaleString('tr-TR')}</td>
                      <td style={{ padding: '12px 20px' }}>{Number(row.total_tokens).toLocaleString('tr-TR')}</td>
                      <td style={{ padding: '12px 20px', color: 'var(--color-text-danger)', fontFamily: 'monospace' }}>
                        ${Number(row.total_cost_usd).toFixed(4)}
                      </td>
                      <td style={{ padding: '12px 20px', color: 'var(--color-text-success)', fontFamily: 'monospace' }}>
                        {Number(row.total_revenue_try).toFixed(2)} ₺
                      </td>
                      <td style={{ padding: '12px 20px' }}>
                        <span style={{ 
                          padding: '2px 8px', 
                          borderRadius: '12px', 
                          fontSize: 11,
                          fontWeight: 500,
                          background: Number(margin) > 50 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          color: Number(margin) > 50 ? 'var(--color-text-success)' : 'var(--color-text-warning)'
                        }}>
                          %{margin}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Görev bazlı tablo */}
        <div style={{ 
          background: 'var(--color-background-primary)',
          border: '1px solid var(--color-border-secondary)',
          borderRadius: '12px', 
          overflow: 'hidden'
        }}>
          <div style={{ padding: '16px 20px', fontWeight: 500, borderBottom: '1px solid var(--color-border-secondary)' }}>
            Görev Bazlı Maliyet
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--color-background-secondary)' }}>
                  {['Görev Türü', 'Çağrı', 'Ort. Token', 'Toplam Maliyet (USD)'].map(h => (
                    <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 500, color: 'var(--color-text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(summary.by_task ?? []).map((row: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--color-border-secondary)' }}>
                    <td style={{ padding: '12px 20px', fontWeight: 500 }}>{row.task_type}</td>
                    <td style={{ padding: '12px 20px' }}>{Number(row.call_count).toLocaleString('tr-TR')}</td>
                    <td style={{ padding: '12px 20px' }}>{Number(row.avg_tokens).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</td>
                    <td style={{ padding: '12px 20px', color: 'var(--color-text-danger)', fontFamily: 'monospace' }}>
                      ${Number(row.total_cost_usd).toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiCostDashboard;
