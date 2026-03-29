import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import type { AuthenticatedSession } from './auth.types';

type RequestWithSession = {
  headers?: Record<string, string | string[] | undefined>;
  authSession?: AuthenticatedSession;
};

@Injectable()
export class AppSessionGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<RequestWithSession>();
    const token = this.extractBearerToken(request.headers?.authorization);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token.');
    }

    request.authSession = await this.authService.getAuthenticatedSession(token);
    return true;
  }

  private extractBearerToken(authorization?: string | string[]) {
    if (!authorization || Array.isArray(authorization)) {
      return undefined;
    }

    const [scheme, token] = authorization.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      return undefined;
    }

    return token;
  }
}

