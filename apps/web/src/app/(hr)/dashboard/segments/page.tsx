'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { 
  MapPin, Award, Baby, Users, Info, Globe, Loader2, BarChart2
} from 'lucide-react';
import { clsx } from 'clsx';
import client from '@/lib/api/client';

const TAB_MAP: Record<string, string> = {
  location: 'location',
  seniority: 'seniority',
  age: 'age_group',
  gender: 'gender',
};

export default function SegmentsPage() {
  const [activeTab, setActiveTab] = useState<'location' | 'seniority' | 'age' | 'gender'>('location');

  const { data: segments = [], isLoading } = useQuery<any[]>({
    queryKey: ['hr-segments', activeTab],
    queryFn: async () => {
      const { data } = await client.get('/hr/dashboard/segments', {
        params: { type: TAB_MAP[activeTab] }
      });
      return Array.isArray(data) ? data : [];
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-navy">Segmentasyon</h1>
          <p className="text-sm text-gray-500">Çalışan grubunuzu farklı demografik kırılımlarda analiz edin.</p>
        </div>
      </div>

      <div className="flex bg-white border border-gray-100 rounded-xl p-1 gap-1">
        <SegmentTab id="location" label="Lokasyon"  icon={MapPin} active={activeTab === 'location'}  onClick={setActiveTab} />
        <SegmentTab id="seniority" label="Kıdem"    icon={Award}  active={activeTab === 'seniority'} onClick={setActiveTab} />
        <SegmentTab id="age"       label="Yaş Grubu" icon={Baby}  active={activeTab === 'age'}       onClick={setActiveTab} />
        <SegmentTab id="gender"    label="Cinsiyet"  icon={Users} active={activeTab === 'gender'}    onClick={setActiveTab} />
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : segments.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center gap-4 text-gray-300">
            <BarChart2 size={48} />
            <div className="text-center">
              <p className="font-bold text-gray-400">Bu segment için henüz veri yok</p>
              <p className="text-xs text-gray-300 mt-1">
                Çalışanlar anketi tamamladıkça segmentasyon verileri burada görünecek.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                <tr>
                  <th className="py-4 px-4">{activeTab.toUpperCase()}</th>
                  <th className="py-4 px-4 text-center">Genel</th>
                  <th className="py-4 px-4 text-center">Fiziksel</th>
                  <th className="py-4 px-4 text-center">Zihinsel</th>
                  <th className="py-4 px-4 text-center">Sosyal</th>
                  <th className="py-4 px-4 text-center">Finansal</th>
                  <th className="py-4 px-4 text-center">İş &amp; Anlam</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {segments.map((row: any) => (
                  <tr key={row.name ?? row.label} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-4 font-bold text-navy">{row.name ?? row.label}</td>
                    <ScoreCell score={row.overall ?? row.scores?.overall} isBold />
                    <ScoreCell score={row.physical ?? row.scores?.physical} />
                    <ScoreCell score={row.mental ?? row.scores?.mental} />
                    <ScoreCell score={row.social ?? row.scores?.social} />
                    <ScoreCell score={row.financial ?? row.scores?.financial} />
                    <ScoreCell score={row.work ?? row.scores?.work} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 mx-4 mb-4 p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
          <Info className="text-blue-500 mt-0.5 flex-shrink-0" size={18} />
          <p className="text-[10px] text-blue-700 font-medium">
            <strong>Gizlilik Notu:</strong> 5'ten az yanıtı olan segment verileri anonimliği korumak amacıyla 
            platform tarafından otomatik olarak maskelenir ve analizlere dahil edilmez.
          </p>
        </div>
      </Card>
    </div>
  );
}

function SegmentTab({ id, label, icon: Icon, active, onClick }: any) {
  return (
    <button
      onClick={() => onClick(id)}
      className={clsx(
        'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all',
        active ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-navy hover:bg-gray-50'
      )}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

function ScoreCell({ score, isBold = false }: { score: number | null | undefined; isBold?: boolean }) {
  const getScoreColor = (s: number | null | undefined) => {
    if (s == null) return 'text-gray-300';
    if (s >= 70) return 'text-primary';
    if (s >= 50) return 'text-warning';
    return 'text-danger';
  };

  return (
    <td className="py-4 px-4 text-center">
      <span className={clsx('text-xs transition-all', getScoreColor(score), isBold ? 'font-black text-sm' : 'font-bold')}>
        {score != null ? score : '—'}
      </span>
    </td>
  );
}
