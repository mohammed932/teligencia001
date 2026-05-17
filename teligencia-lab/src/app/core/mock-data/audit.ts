/*
 * Mock audit events — 30 entries spread across today/yesterday/2 days ago.
 * All business-hour timestamps (08:00–18:00 UTC). Every gate label appears.
 */

import { AuditEvent } from '../models/domain';

function at(daysAgo: number, hh: number, mm: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(hh, mm, 0, 0);
  return d.toISOString();
}

export const AUDIT_EVENTS: AuditEvent[] = [
  // Today
  { id: 'a-001', actorId: 'u7', action: 'report.signed',         entityType: 'report',          entityRef: 'R-2026-008', projectId: 'pr-010',
    summary: 'Report R-2026-008 signed (BPM Connect Pro)', gate: 'G-03', at: at(0, 16, 45) },
  { id: 'a-002', actorId: 'u3', action: 'evidence.uploaded',     entityType: 'evidence',        entityRef: 'EV-401',     projectId: 'pr-001',
    summary: 'Evidence uploaded — firmware_dump_gen3.bin', at: at(0, 15, 30) },
  { id: 'a-003', actorId: 'u3', action: 'evidence.locked',       entityType: 'evidence',        entityRef: 'EV-401',     projectId: 'pr-001',
    summary: 'Evidence EV-401 locked (gate G-04 invariant)', gate: 'G-04', at: at(0, 15, 32) },
  { id: 'a-004', actorId: 'u5', action: 'finding.approved_for_customer', entityType: 'finding', entityRef: 'F-2026-007', projectId: 'pr-006',
    summary: 'Finding F-2026-007 approved for customer visibility', at: at(0, 14, 50) },
  { id: 'a-005', actorId: 'u4', action: 'finding.created',       entityType: 'finding',         entityRef: 'F-2026-019', projectId: 'pr-001',
    summary: 'Finding F-2026-019 created (LOW)', at: at(0, 14, 15) },
  { id: 'a-006', actorId: 'u2', action: 'project.status_changed', entityType: 'project',        entityRef: 'TLG-2026-001', projectId: 'pr-001',
    summary: 'TLG-2026-001 moved FINDINGS_REVIEW → IN_TESTING', at: at(0, 13, 5) },
  { id: 'a-007', actorId: 'u3', action: 'evidence.uploaded',     entityType: 'evidence',        entityRef: 'EV-402',     projectId: 'pr-002',
    summary: 'Evidence uploaded — pcap_mgmt_port.pcapng', at: at(0, 12, 40) },
  { id: 'a-008', actorId: 'u6', action: 'finding.severity_changed', entityType: 'finding',      entityRef: 'F-2026-009', projectId: 'pr-006',
    summary: 'Severity changed MEDIUM → LOW with justification', at: at(0, 11, 30) },
  { id: 'a-009', actorId: 'u2', action: 'contract_review.approved', entityType: 'contract_review', entityRef: 'CR-005', projectId: 'pr-005',
    summary: 'Contract review CR-005 approved (gate G-01 satisfied)', gate: 'G-01', at: at(0, 10, 15) },
  { id: 'a-010', actorId: 'u2', action: 'project.status_changed', entityType: 'project',        entityRef: 'TLG-2026-005', projectId: 'pr-005',
    summary: 'TLG-2026-005 moved CONTRACT_REVIEW → READY_FOR_TESTING', gate: 'G-01', at: at(0, 10, 17) },
  { id: 'a-011', actorId: 'u8', action: 'ai.output.accepted',    entityType: 'finding',         entityRef: 'F-2026-018', projectId: 'pr-009',
    summary: 'AI-classified finding accepted by reviewer (gate G-07)', gate: 'G-07', at: at(0, 9, 30) },
  { id: 'a-012', actorId: 'u2', action: 'project.created',       entityType: 'project',         entityRef: 'TLG-2026-014', projectId: 'pr-016',
    summary: 'Project TLG-2026-014 created (status NEW)', at: at(0, 9, 10) },

  // Yesterday
  { id: 'a-013', actorId: 'u7', action: 'report.review_approved', entityType: 'report',         entityRef: 'R-2026-008', projectId: 'pr-010',
    summary: 'Reviewer approved R-2026-008 (gate G-03 ready)', gate: 'G-03', at: at(1, 17, 50) },
  { id: 'a-014', actorId: 'u3', action: 'finding.created',       entityType: 'finding',         entityRef: 'F-2026-002', projectId: 'pr-001',
    summary: 'Finding F-2026-002 created (HIGH)', at: at(1, 16, 25) },
  { id: 'a-015', actorId: 'u5', action: 'finding.severity_changed', entityType: 'finding',      entityRef: 'F-2026-001', projectId: 'pr-001',
    summary: 'Severity escalated HIGH → CRITICAL after additional repro', at: at(1, 15, 10) },
  { id: 'a-016', actorId: 'u2', action: 'gate.blocked',          entityType: 'project',         entityRef: 'TLG-2026-007', projectId: 'pr-007',
    summary: 'Gate G-01 blocked: ContractReview not approved', gate: 'G-01', at: at(1, 14, 40) },
  { id: 'a-017', actorId: 'u4', action: 'evidence.uploaded',     entityType: 'evidence',        entityRef: 'EV-388',     projectId: 'pr-003',
    summary: 'Evidence uploaded — apk_static_scan.json', at: at(1, 13, 20) },
  { id: 'a-018', actorId: 'u6', action: 'finding.approved_for_customer', entityType: 'finding', entityRef: 'F-2026-005', projectId: 'pr-003',
    summary: 'Finding F-2026-005 approved for customer visibility', at: at(1, 11, 55) },
  { id: 'a-019', actorId: 'u5', action: 'report.draft_created',  entityType: 'report',          entityRef: 'R-2026-009', projectId: 'pr-008',
    summary: 'Draft report R-2026-009 created for AC500 evaluation', at: at(1, 11, 5) },
  { id: 'a-020', actorId: 'u2', action: 'contract_review.rejected', entityType: 'contract_review', entityRef: 'CR-007', projectId: 'pr-007',
    summary: 'Contract review CR-007 rejected — decision_rule missing', gate: 'G-02', at: at(1, 10, 30) },
  { id: 'a-021', actorId: 'u3', action: 'evidence.locked',       entityType: 'evidence',        entityRef: 'EV-377',     projectId: 'pr-002',
    summary: 'Evidence EV-377 locked', gate: 'G-04', at: at(1, 9, 50) },

  // 2 days ago
  { id: 'a-022', actorId: 'u7', action: 'report.issued',         entityType: 'report',          entityRef: 'R-2026-007', projectId: 'pr-011',
    summary: 'Report R-2026-007 issued (Sonos Era 300 SBOM)', gate: 'G-05', at: at(2, 17, 15) },
  { id: 'a-023', actorId: 'u3', action: 'finding.created',       entityType: 'finding',         entityRef: 'F-2026-014', projectId: 'pr-001',
    summary: 'Finding F-2026-014 created (MEDIUM)', at: at(2, 16, 0) },
  { id: 'a-024', actorId: 'u4', action: 'finding.created',       entityType: 'finding',         entityRef: 'F-2026-015', projectId: 'pr-001',
    summary: 'Finding F-2026-015 created (LOW)', at: at(2, 15, 30) },
  { id: 'a-025', actorId: 'u5', action: 'finding.severity_changed', entityType: 'finding',      entityRef: 'F-2026-013', projectId: 'pr-009',
    summary: 'Severity confirmed MEDIUM after dual review', at: at(2, 14, 20) },
  { id: 'a-026', actorId: 'u2', action: 'project.status_changed', entityType: 'project',        entityRef: 'TLG-2026-002', projectId: 'pr-002',
    summary: 'TLG-2026-002 moved IN_TESTING → FINDINGS_REVIEW', at: at(2, 13, 0) },
  { id: 'a-027', actorId: 'u3', action: 'evidence.uploaded',     entityType: 'evidence',        entityRef: 'EV-371',     projectId: 'pr-002',
    summary: 'Evidence uploaded — fw_unpack_log.txt', at: at(2, 12, 10) },
  { id: 'a-028', actorId: 'u8', action: 'ai.output.accepted',    entityType: 'finding',         entityRef: 'F-2026-013', projectId: 'pr-009',
    summary: 'AI-suggested clause mapping accepted (gate G-07)', gate: 'G-07', at: at(2, 11, 30) },
  { id: 'a-029', actorId: 'u2', action: 'gate.blocked',          entityType: 'project',         entityRef: 'TLG-2026-004', projectId: 'pr-004',
    summary: 'Gate G-01 blocked: cannot move to READY_FOR_TESTING', gate: 'G-01', at: at(2, 10, 5) },
  { id: 'a-030', actorId: 'u2', action: 'project.created',       entityType: 'project',         entityRef: 'TLG-2026-013', projectId: 'pr-015',
    summary: 'Project TLG-2026-013 created (EV Charger evaluation)', at: at(2, 9, 0) }
];
