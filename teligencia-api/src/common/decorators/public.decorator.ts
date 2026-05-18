/*
 * @Public() — opts a single route out of the global ClerkAuthGuard.
 * The only constitutional consumer in Feature 001 is the Clerk webhook,
 * which is gated by svix signature verification instead.
 */

import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(IS_PUBLIC_KEY, true);
