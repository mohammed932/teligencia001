/*
 * Request-scoped identity populated by ClerkAuthGuard.
 * Downstream handlers MUST read identity/org/role from this object,
 * never from request headers, body, or query params (Principle 6).
 */

import 'express';
import { StaffRole } from './staff-role';

export interface CurrentUser {
  /** Clerk user id ("user_xxx"); same value as `users.id`. */
  id: string;
  /** Internal organisation UUID (NOT Clerk's org id). */
  orgId: string;
  email: string;
  fullName: string | null;
  /** Always non-null when present in req.user — the guard rejects null-role users. */
  role: StaffRole;
}

declare module 'express' {
  interface Request {
    user?: CurrentUser;
  }
}
