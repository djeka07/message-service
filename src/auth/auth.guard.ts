import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { isEmpty } from '../app/helpers/array';
import { IS_PUBLIC_KEY } from './auth.decorator';

@Injectable()
export class AuthGuard extends JwtAuthGuard {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    await super.canActivate(context);
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    const { user } = context.switchToHttp().getRequest();
    if (isEmpty(roles)) {
      return true;
    }
    return roles.some((role) => user?.roles?.includes(role));
  }
}
