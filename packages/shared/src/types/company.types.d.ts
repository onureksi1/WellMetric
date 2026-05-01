export type PlanType = 'starter' | 'growth' | 'enterprise';
export type SizeBand = '1-50' | '51-250' | '251-1000' | '1000+';
export interface CompanySettings {
    employeeAccounts: boolean;
    anonymityThreshold: number;
    benchmarkVisible: boolean;
    defaultLanguage: 'tr' | 'en';
}
export interface Company {
    id: string;
    name: string;
    slug: string;
    industry: string | null;
    sizeBand: SizeBand | null;
    plan: PlanType;
    planExpiresAt: string | null;
    isActive: boolean;
    contactEmail: string | null;
    logoUrl: string | null;
    settings: CompanySettings;
    createdAt: string;
}
