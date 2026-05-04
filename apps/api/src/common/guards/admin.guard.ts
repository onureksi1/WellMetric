import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    
    if (!user || user.role !== 'super_admin') {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Bu işlem için super admin yetkisi gerekmektedir.',
      });
    }
    
    return true;
  }
}
