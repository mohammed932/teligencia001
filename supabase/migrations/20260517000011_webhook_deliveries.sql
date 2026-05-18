-- Feature 001 — `webhook_deliveries` idempotency ledger.
-- Primary key = Clerk's `svix-id` header. Used to short-circuit replayed
-- webhook deliveries before any side effects (row writes, audit entries).
-- See data-model.md and research D4.

CREATE TABLE webhook_deliveries (
  svix_id      TEXT        PRIMARY KEY,
  received_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_type   TEXT        NOT NULL,
  status       TEXT        NOT NULL CHECK (status IN ('processed', 'skipped', 'failed'))
);

CREATE INDEX idx_webhook_deliveries_received_at
  ON webhook_deliveries (received_at DESC);

ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
-- No client policy. service_role only (RLS bypass).
GRANT SELECT, INSERT, UPDATE ON webhook_deliveries TO service_role;
