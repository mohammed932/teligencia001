-- Feature 001 — add Clerk organisation mapping to `organisations`.
-- The Clerk webhook resolves the tenant by looking up the Clerk-provided
-- `organization_id` against `organisations.clerk_org_id`. A partial unique
-- index allows pre-existing rows (no Clerk binding yet) to coexist while
-- preventing duplicate mappings once set.

ALTER TABLE organisations
  ADD COLUMN IF NOT EXISTS clerk_org_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_organisations_clerk_org_id
  ON organisations (clerk_org_id)
  WHERE clerk_org_id IS NOT NULL;
