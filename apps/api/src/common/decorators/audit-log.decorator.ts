import { SetMetadata } from '@nestjs/common';

export const AUDIT_LOG_KEY = 'audit_log';

export interface AuditLogMetadata {
  action: string;
  targetType?: string;
}

export const AuditLog = (action: string, targetType?: string) =>
  SetMetadata(AUDIT_LOG_KEY, { action, targetType });
