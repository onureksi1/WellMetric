'use client';

export const dynamic = 'force-dynamic';

import React from 'react';

export default function ReportsPage() {
  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-navy">Raporlar</h1>
        <p className="text-sm text-gray-500">Aylık verileri ve analizleri görüntüleyin.</p>
      </div>

      <div style={{
        background: 'var(--color-background-secondary)',
        borderRadius: 'var(--border-radius-lg)',
        padding: '2rem', textAlign: 'center',
        border: '0.5px solid var(--color-border-tertiary)',
      }}>
        <div style={{ fontSize:32, marginBottom:12 }}>📋</div>
        <div style={{ fontWeight:500, fontSize:15, marginBottom:8 }}>
          Raporlar danışmanınız tarafından hazırlanır
        </div>
        <div style={{ fontSize:13, color:'var(--color-text-secondary)',
          lineHeight:1.6 }}>
          Danışmanınız analiz raporlarını PDF olarak hazırlayıp
          size iletecektir.
        </div>
      </div>
    </div>
  );
}
