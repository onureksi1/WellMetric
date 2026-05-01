export const INDUSTRIES = [
  { value: 'technology',    label_tr: 'Teknoloji',
                            label_en: 'Technology' },
  { value: 'finance',       label_tr: 'Finans & Bankacılık',
                            label_en: 'Finance & Banking' },
  { value: 'healthcare',    label_tr: 'Sağlık',
                            label_en: 'Healthcare' },
  { value: 'retail',        label_tr: 'Perakende',
                            label_en: 'Retail' },
  { value: 'manufacturing', label_tr: 'Üretim & Sanayi',
                            label_en: 'Manufacturing' },
  { value: 'education',     label_tr: 'Eğitim',
                            label_en: 'Education' },
  { value: 'logistics',     label_tr: 'Lojistik & Taşımacılık',
                            label_en: 'Logistics & Transportation' },
  { value: 'energy',        label_tr: 'Enerji',
                            label_en: 'Energy' },
  { value: 'construction',  label_tr: 'İnşaat & Gayrimenkul',
                            label_en: 'Construction & Real Estate' },
  { value: 'media',         label_tr: 'Medya & İletişim',
                            label_en: 'Media & Communications' },
  { value: 'tourism',       label_tr: 'Turizm & Otelcilik',
                            label_en: 'Tourism & Hospitality' },
  { value: 'food_beverage', label_tr: 'Gıda & İçecek',
                            label_en: 'Food & Beverage' },
  { value: 'automotive',    label_tr: 'Otomotiv',
                            label_en: 'Automotive' },
  { value: 'telecom',       label_tr: 'Telekomünikasyon',
                            label_en: 'Telecommunications' },
  { value: 'insurance',     label_tr: 'Sigorta',
                            label_en: 'Insurance' },
  { value: 'consulting',    label_tr: 'Danışmanlık',
                            label_en: 'Consulting' },
  { value: 'public_sector', label_tr: 'Kamu Sektörü',
                            label_en: 'Public Sector' },
  { value: 'ngo',           label_tr: 'STK & Sivil Toplum',
                            label_en: 'NGO & Civil Society' },
  { value: 'other',         label_tr: 'Diğer',
                            label_en: 'Other' },
] as const;

export type IndustryValue = typeof INDUSTRIES[number]['value'];

export function getIndustryLabel(
  value: string,
  lang: 'tr' | 'en' = 'tr'
): string {
  const industry = INDUSTRIES.find(i => i.value === value);
  if (!industry) return value;
  return lang === 'en' ? industry.label_en : industry.label_tr;
}
