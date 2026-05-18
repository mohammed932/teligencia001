-- Feature 001 — comment-only registration of audit action codes consumed by
-- this feature. `audit_log.action` is a free-form TEXT column, so this
-- migration adds nothing structural — it exists for grep-ability and to
-- create a single canonical document of which actions Feature 001 owns.
--
-- Action          Trigger                                                  Actor
-- ---------------  -------------------------------------------------------  --------------
-- USER_CREATED     Clerk webhook user.created accepted (new users row)      Clerk webhook
-- USER_UPDATED     Clerk webhook user.updated accepted (row updated)        Clerk webhook
-- SESSION_STARTED  First authenticated request after Clerk sign-in          users.id
-- SESSION_ENDED    Sign-out — frontend signals POST /api/v1/auth/sign-out   users.id
-- AUTH_FAILED      Credentialed-but-rejected: token signature/exp/role bad  users.id or NULL
--
-- Spec Clarification 5: AUTH_FAILED is NOT emitted for missing-token
-- requests (probe / unauthenticated traffic). Missing-token requests are
-- rejected 401 silently.

COMMENT ON TABLE audit_log IS
  'Append-only audit log. Action codes documented in 20260517000012_audit_log_actions_doc.sql. INSERT-only across every role including service_role (Gate G-06).';
