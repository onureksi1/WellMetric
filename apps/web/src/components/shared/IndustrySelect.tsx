import React, { useState } from 'react';
import { Combobox } from '@headlessui/react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import client from '@/lib/api/client';

interface Industry {
  value: string;
  label: string;
}

interface IndustrySelectProps {
  value: string;
  onChange: (value: string | null) => void;
  language?: 'tr' | 'en';
  placeholder?: string;
  className?: string;
}

export function IndustrySelect({ 
  value, 
  onChange, 
  language = 'tr',
  placeholder,
  className
}: IndustrySelectProps) {
  const { t } = useTranslation('common');
  const [query, setQuery] = useState('');

  const { data: industries = [], isLoading } = useQuery({
    queryKey: ['industries', language],
    queryFn: async () => {
      const res = await client.get(`/industries?lang=${language}`);
      return res.data as Industry[];
    }
  });

  const filteredIndustries = query === ''
    ? industries
    : industries.filter((industry) => {
        return industry.label.toLowerCase().includes(query.toLowerCase());
      });

  const selectedIndustry = industries.find((i) => i.value === value);

  return (
    <div className={clsx('relative', className)}>
      <Combobox value={value || ''} onChange={onChange}>
        <div className="relative">
          <Combobox.Input
            className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-3 pr-10 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            displayValue={(val: string) => {
              const item = industries.find(i => i.value === val);
              return item ? item.label : '';
            }}
            placeholder={placeholder || t('common.industries.placeholder', 'Sektör seçin')}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
            {isLoading ? (
              <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
            ) : (
              <ChevronsUpDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
            )}
          </Combobox.Button>
        </div>
        <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white py-1 text-base shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm border border-gray-100">
          {filteredIndustries.length === 0 && query !== '' ? (
            <div className="relative cursor-default select-none py-2 px-4 text-gray-700 italic">
              {t('common.industries.not_found', 'Sektör bulunamadı')}
            </div>
          ) : (
            filteredIndustries.map((industry) => (
              <Combobox.Option
                key={industry.value}
                className={({ active }) =>
                  clsx(
                    'relative cursor-pointer select-none py-2.5 pl-10 pr-4 transition-colors',
                    active ? 'bg-primary/5 text-primary' : 'text-navy'
                  )
                }
                value={industry.value}
              >
                {({ selected, active }) => (
                  <>
                    <span className={clsx('block truncate', selected ? 'font-bold text-primary' : 'font-normal')}>
                      {industry.label}
                    </span>
                    {selected ? (
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                        <Check className="h-4 w-4" aria-hidden="true" />
                      </span>
                    ) : null}
                  </>
                )}
              </Combobox.Option>
            ))
          )}
        </Combobox.Options>
      </Combobox>
    </div>
  );
}
