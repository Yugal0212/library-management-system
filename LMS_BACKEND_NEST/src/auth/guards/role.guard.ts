import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../../common/enums';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly requiredRole: UserRole) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return false;
    
    // Admin can access everything
    if (user.role === UserRole.ADMIN) return true;
    
    return user.role === this.requiredRole;
  }
}
