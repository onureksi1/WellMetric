export interface AuditLogParams {
  userId: string | null;
  companyId: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  payload?: Record<string, any>;
  ipAddress?: string;
}
