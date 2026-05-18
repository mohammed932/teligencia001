/*
 * Narrow types for the Clerk webhook events Feature 001 handles.
 * Clerk's full event schema is wider; we only model the fields we read.
 */

export type ClerkEventType =
  | 'user.created'
  | 'user.updated'
  | 'session.created';

export interface ClerkEmailAddress {
  id: string;
  email_address: string;
}

export interface ClerkUserEventData {
  id: string;
  email_addresses?: ClerkEmailAddress[];
  primary_email_address_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  public_metadata?: { role?: string | null; [k: string]: unknown };
  organization_memberships?: Array<{
    organization?: { id?: string };
  }>;
  banned?: boolean;
  locked?: boolean;
}

export interface ClerkSessionEventData {
  id: string;
  user_id: string;
}

export interface ClerkEvent {
  type: ClerkEventType;
  data: ClerkUserEventData | ClerkSessionEventData;
}

/** Pick the primary email from a Clerk user payload. */
export function primaryEmail(u: ClerkUserEventData): string {
  const primaryId = u.primary_email_address_id;
  const list = u.email_addresses ?? [];
  const primary = list.find((e) => e.id === primaryId) ?? list[0];
  return primary?.email_address ?? '';
}

/** Pick the first org membership id, if any. */
export function primaryOrgId(u: ClerkUserEventData): string | null {
  const m = u.organization_memberships ?? [];
  return m[0]?.organization?.id ?? null;
}

/** Compose a full_name string from optional first/last fields. */
export function fullName(u: ClerkUserEventData): string | null {
  const parts = [u.first_name, u.last_name].filter(
    (s): s is string => typeof s === 'string' && s.length > 0,
  );
  return parts.length ? parts.join(' ') : null;
}
