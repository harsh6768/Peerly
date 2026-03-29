import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import type { AuthenticatedSession } from './auth.types';

export const CurrentSession = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedSession | undefined => {
    const request = context.switchToHttp().getRequest<{ authSession?: AuthenticatedSession }>();
    return request.authSession;
  },
);

