'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  MapPin, 
  Award, 
  Baby, 
  Users, 
  Info,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Globe
} from 'lucide-react';
import { clsx } from 'clsx';

const segments = {
  location: [
    { name: 'Remote', overall: 58, physical: 55, mental: 52, social: 61, financial: 60, work: 65 },
    { name: 'İstanbul', overall: 67, physical: 64, mental: 63, social: 74, financial: 62, work: 70 },
    { name: 'Ankara', overall: 71, physical: 68, mental: 68, social: 78, financial: 65, work: 74 },
  ],
  seniority: [
    { name: 'Junior', overall: 62, physical: 60, mental: 58, social: 70, financial: 55, work: 68 },
    { name: 'Mid-level', overall: 68, physical: 65, mental: 64, social: 72, financial: 62, work: 70 },
    { name: 'Senior', overall: 74, physical: 72, mental: 72, social: 78, financial: 68, work: 75 },
    { name: 'Lead/Manager', overall: 61, physical: 58, mental: 54, social: 68, financial: 65, work: 62 },
  ],
};

export default function SegmentsPage() {
  const [activeTab, setActiveTab] = useState<'location' | 'seniority' | 'age' | 'gender'>('location');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-navy">Segmentasyon</h1>
          <p className="text-sm text-gray-500">Çalışan grubunuzu farklı demografik kırılımlarda analiz edin.</p>
        </div>
      </div>

      <div className="flex bg-white border border-gray-100 rounded-xl p-1 gap-1">
        <SegmentTab id="location" label="Lokasyon" icon={MapPin} active={activeTab === 'location'} onClick={setActiveTab} />
        <SegmentTab id="seniority" label="Kıdem" icon={Award} active={activeTab === 'seniority'} onClick={setActiveTab} />
        <SegmentTab id="age" label="Yaş Grubu" icon={Baby} active={activeTab === 'age'} onClick={setActiveTab} />
        <SegmentTab id="gender" label="Cinsiyet" icon={Users} active={activeTab === 'gender'} onClick={setActiveTab} />
      </div>

      <Card>
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
                <th className="py-4 px-4 text-center">İş & Anlam</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(segments[activeTab as keyof typeof segments] || []).map((row: any) => (
                <tr key={row.name} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="py-4 px-4 font-bold text-navy">{row.name}</td>
                  <ScoreCell score={row.overall} isBold />
                  <ScoreCell score={row.physical} />
                  <ScoreCell score={row.mental} />
                  <ScoreCell score={row.social} />
                  <ScoreCell score={row.financial} />
                  <ScoreCell score={row.work} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-3">
              <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center text-primary shadow-sm">
                 <Globe size={18} />
              </div>
              <div>
                 <p className="text-xs font-bold text-navy uppercase mb-1">Segment Insight</p>
                 <p className="text-xs text-gray-500 leading-relaxed">
                   {activeTab === 'location' ? (
                     "Remote çalışanların Sosyal skoru ofis çalışanlarına göre 13 puan daha düşük seyrediyor."
                   ) : (
                     "Junior çalışanların Finansal skorlarında bu ay %5'lik bir iyileşme gözlemlendi."
                   )}
                 </p>
              </div>
           </div>

           <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
              <Info className="text-blue-500 mt-0.5" size={18} />
              <p className="text-[10px] text-blue-700 font-medium">
                <strong>Gizlilik Notu:</strong> 5'ten az yanıtı olan segment verileri anonimliği korumak amacıyla platform tarafından 
                otomatik olarak maskelenir ve analizlere dahil edilmez.
              </p>
           </div>
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

function ScoreCell({ score, isBold = false }: { score: number | null, isBold?: boolean }) {
  const getScoreColor = (s: number | null) => {
    if (s === null) return 'text-gray-300';
    if (s >= 70) return 'text-primary';
    if (s >= 50) return 'text-warning';
    return 'text-danger';
  };

  return (
    <td className="py-4 px-4 text-center">
       <span className={clsx(
         'text-xs transition-all',
         getScoreColor(score),
         isBold ? 'font-black text-sm' : 'font-bold'
       )}>
         {score ?? '--'}
       </span>
    </td>
  );
}
