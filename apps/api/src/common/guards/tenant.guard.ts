import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Kullanıcı bulunamadı.',
      });
    }

    // super_admin her şeyi görebilir
    if (user.role === 'super_admin') {
      return true;
    }

    // consultant kendi firmalarına erişebilir (Servis katmanında filtrelenecek)
    if (user.role === 'consultant') {
      return true;
    }

    const requestCompanyId = request.headers['x-company-id'] || request.body?.company_id || request.query?.company_id || request.params?.company_id;
    
    // hr_admin sadece kendi firmasına erişebilir
    if (user.role === 'hr_admin') {
      if (requestCompanyId && requestCompanyId !== user.company_id) {
        throw new ForbiddenException({
          code: 'TENANT_MISMATCH',
          message: 'Bu şirkete erişim yetkiniz bulunmamaktadır.',
        });
      }
      return !!user.company_id;
    }

    return false;
  }
}
