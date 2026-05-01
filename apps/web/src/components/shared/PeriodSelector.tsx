'use client';

import React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Calendar } from 'lucide-react';
import { format, subMonths, startOfMonth } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';

export const PeriodSelector = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPeriod = searchParams.get('period') || format(new Date(), 'yyyy-MM');

  // Generate last 12 months
  const periods = Array.from({ length: 12 }).map((_, i) => {
    const date = subMonths(new Date(), i);
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy', { locale: tr }) // TODO: i18n
    };
  });

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams);
    params.set('period', e.target.value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
      <Calendar size={16} className="text-gray-400" />
      <select
        value={currentPeriod}
        onChange={handlePeriodChange}
        className="bg-transparent border-none text-sm font-semibold text-navy focus:ring-0 cursor-pointer outline-none"
      >
        {periods.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
    </div>
  );
};
