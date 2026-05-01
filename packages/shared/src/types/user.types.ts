// ── User Roles ────────────────────────────────────────────────────────────────

export type UserRole = 'super_admin' | 'hr_admin' | 'employee';

// ── User ──────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  companyId: string | null; // null for super_admin
  departmentId: string | null;
  email: string;
  fullName: string | null;
  role: UserRole;

  // Segmentation (all optional)
  position: string | null;
  location: string | null;
  seniority: 'junior' | 'mid' | 'senior' | 'lead' | 'manager' | null;
  ageGroup: '18-25' | '26-35' | '36-45' | '46+' | null;
  gender: 'male' | 'female' | 'other' | 'prefer_not' | null;
  startDate: string | null; // ISO date

  language: 'tr' | 'en';
  isActive: boolean;
  lastLoginAt: string | null; // ISO datetime
  createdAt: string; // ISO datetime
}

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
  companyId: string | null;
}
