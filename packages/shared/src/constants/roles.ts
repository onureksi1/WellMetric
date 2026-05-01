// ── Role constants ────────────────────────────────────────────────────────────
// Use these instead of raw strings to avoid typos across apps.

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  HR_ADMIN: 'hr_admin',
  EMPLOYEE: 'employee',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
