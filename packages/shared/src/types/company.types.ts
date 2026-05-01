// ── Company ───────────────────────────────────────────────────────────────────

export type PlanType = 'starter' | 'growth' | 'enterprise';

export type SizeBand = '1-50' | '51-250' | '251-1000' | '1000+';

export interface CompanySettings {
  /** true = employee accounts created; false = link-based survey filling */
  employeeAccounts: boolean;
  /** Minimum response count before department detail is shown */
  anonymityThreshold: number;
  /** Whether to show industry benchmarks */
  benchmarkVisible: boolean;
  /** Default UI language for this company */
  defaultLanguage: 'tr' | 'en';
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  sizeBand: SizeBand | null;
  plan: PlanType;
  planExpiresAt: string | null; // ISO datetime
  isActive: boolean;
  contactEmail: string | null;
  logoUrl: string | null; // S3 object key
  settings: CompanySettings;
  createdAt: string; // ISO datetime
}
