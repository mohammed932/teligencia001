/*
 * The six fixed staff roles (Constitution Article IV).
 * Source of truth is Clerk publicMetadata.role; mirrored into users.role
 * via the user-sync webhook. Adding/removing a role requires a
 * constitutional amendment.
 */

export const STAFF_ROLES = [
  'lab_admin',
  'pm',
  'test_engineer',
  'reviewer',
  'signatory',
  'quality_manager',
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export function isStaffRole(value: unknown): value is StaffRole {
  return (
    typeof value === 'string' &&
    (STAFF_ROLES as readonly string[]).includes(value)
  );
}
