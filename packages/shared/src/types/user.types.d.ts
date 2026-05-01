export type UserRole = 'super_admin' | 'hr_admin' | 'employee';
export interface User {
    id: string;
    companyId: string | null;
    departmentId: string | null;
    email: string;
    fullName: string | null;
    role: UserRole;
    position: string | null;
    location: string | null;
    seniority: 'junior' | 'mid' | 'senior' | 'lead' | 'manager' | null;
    ageGroup: '18-25' | '26-35' | '36-45' | '46+' | null;
    gender: 'male' | 'female' | 'other' | 'prefer_not' | null;
    startDate: string | null;
    language: 'tr' | 'en';
    isActive: boolean;
    lastLoginAt: string | null;
    createdAt: string;
}
export interface JwtPayload {
    sub: string;
    email: string;
    role: UserRole;
    companyId: string | null;
}
