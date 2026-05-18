# Pull Request

## Summary

<!-- One sentence on what changed and why. -->

## Constitution — 10-Point Security Checklist

Every PR must pass all ten points. Tick each box; failed items block merge.

- [ ]  1. All database queries filter by `org_id`.
- [ ]  2. Every service-layer mutation calls the audit logger.
- [ ]  3. No secrets in code, config files committed to Git, or documents.
- [ ]  4. SHA-256 file hashing computed server-side. (N/A if no uploads)
- [ ]  5. File MIME type validated by content server-side. (N/A if no uploads)
- [ ]  6. Every NestJS controller endpoint carries a role guard. (`ClerkAuthGuard` is global; `@Roles()` where role-restricted)
- [ ]  7. Customer-facing responses use DTOs that exclude internal fields.
- [ ]  8. Error messages to clients are generic; detail is logged server-side.
- [ ]  9. File storage paths include the `org_id` prefix. (N/A if no storage)
- [ ] 10. All webhook signatures are verified before processing.

## Gates touched

<!-- List any G-01 … G-08 gates this PR modifies or relies on. -->

## Tests

- [ ] Unit tests added/updated
- [ ] e2e / integration tests added/updated
- [ ] Tenant-isolation verified (if RLS-relevant table touched)
- [ ] G-06 immutability verified (if `audit_log` touched)

## Linked spec

`specs/###-<branch>/`
