export declare const ROLES: {
    readonly SUPER_ADMIN: "super_admin";
    readonly HR_ADMIN: "hr_admin";
    readonly EMPLOYEE: "employee";
};
export type Role = (typeof ROLES)[keyof typeof ROLES];
