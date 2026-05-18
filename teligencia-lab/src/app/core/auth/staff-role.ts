/*
 * Mirror of the backend's StaffRole union (kept in sync manually until a
 * shared package exists). Source of truth: teligencia-api StaffRole.
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
