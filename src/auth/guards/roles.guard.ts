import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../users/entities/user/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Request } from 'express';
import { User } from '../../users/entities/user/user.entity';
interface RequestWithUser extends Request {
  user: User;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    //get the roles required for the route
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No roles required
    }

    const request: RequestWithUser = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }
    // Allow ADMIN to access everything
    if (user.role === UserRole.ADMIN) {
      return true;
    }
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        'You do not have permission (role) for this resource',
      );
    }
    return true;
  }
}
