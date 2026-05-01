import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class ConsultantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user) return false;

    // super_admin has global access
    if (user.role === 'super_admin') return true;

    // consultant can only access their own companies
    if (user.role === 'consultant') {
      // Logic for ownership verification will be handled in the service/controller
      // but this guard ensures the user HAS the consultant role at least.
      return true;
    }

    return false;
  }
}
