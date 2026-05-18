/*
 * @Roles('lab_admin', ...) — restricts a route to specific staff roles.
 * Enforced by RolesGuard (registered globally after ClerkAuthGuard).
 * A handler without @Roles() still requires authentication.
 */

import { SetMetadata } from '@nestjs/common';
import { StaffRole } from '../types/staff-role';

export const ROLES_KEY = 'roles';
export const Roles = (
  ...roles: StaffRole[]
): MethodDecorator & ClassDecorator => SetMetadata(ROLES_KEY, roles);
