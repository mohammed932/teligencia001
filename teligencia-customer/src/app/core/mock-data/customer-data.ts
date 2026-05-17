/*
 * Customer-portal mock data.
 * Simulates "Bosch GmbH" as the signed-in customer org.
 * Only customer-visible records are exposed.
 */

import { CustomerFinding, CustomerMessage, CustomerProject, CustomerReport } from '../models/domain';

const NOW = Date.now();
const days = (n: number) => new Date(NOW - n * 86_400_000).toISOString();
const inHours = (h: number) => new Date(NOW + h * 3_600_000).toISOString();

export const CURRENT_CUSTOMER = {
  orgId: 'org-bosch',
  orgName: 'Bosch GmbH',
  contactName: 'Andreas Weber',
  contactRole: 'Compliance Lead',
  initials: 'AW'
};

export const CUSTOMER_PROJECTS: CustomerProject[] = [
  {
    id: 'pr-001', code: 'TLG-2026-001',
    title: 'EN 18031-1 evaluation — Smart Home Controller Gen-3',
    productName: 'Smart Home Controller Gen-3',
    type: 'EVALUATION', status: 'IN_TESTING',
    standards: ['EN_18031_1', 'EN_18031_2'],
    pmName: 'Lea Hoffmann', pmInitials: 'LH',
    progressPct: 62,
    startedAt: days(28),
    slaDueAt: inHours(72),
    nextActionForCustomer: 'No action needed — lab testing in progress.',
    hasIssuedReport: false
  },
  {
    id: 'pr-003', code: 'TLG-2026-003',
    title: 'MA-DD continuous monitoring — Hue Bridge 2.1',
    productName: 'Hue Bridge 2.1',
    type: 'MA_DD', status: 'IN_TESTING',
    standards: ['EN_18031_1', 'EN_18031_3'],
    pmName: 'Lea Hoffmann', pmInitials: 'LH',
    progressPct: 41,
    startedAt: days(60),
    slaDueAt: inHours(36),
    nextActionForCustomer: 'Review mitigation for finding F-2026-005.',
    hasIssuedReport: false
  },
  {
    id: 'pr-007', code: 'TLG-2026-007',
    title: 'DPP attestation — T6 Pro Thermostat',
    productName: 'T6 Pro Thermostat',
    type: 'DPP', status: 'INTAKE_IN_PROGRESS',
    standards: ['EN_18031_1'],
    pmName: 'Lea Hoffmann', pmInitials: 'LH',
    progressPct: 5,
    startedAt: days(3),
    nextActionForCustomer: 'Complete intake form (3 sections remaining).',
    hasIssuedReport: false
  },
  {
    id: 'pr-015', code: 'TLG-2026-013',
    title: 'EV Charger evaluation — Bosch CCS',
    productName: 'Cloud-Connected EV Charger',
    type: 'EVALUATION', status: 'PO_RECEIVED',
    standards: ['EN_18031_1', 'IEC_62443_4_2'],
    pmName: 'Lea Hoffmann', pmInitials: 'LH',
    progressPct: 8,
    startedAt: days(4),
    nextActionForCustomer: 'Awaiting kickoff call — Lea will reach out.',
    hasIssuedReport: false
  },
  {
    id: 'pr-012', code: 'TLG-2025-198',
    title: 'EN 18031 evaluation — Tap IP Conference Controller',
    productName: 'Tap IP Conference Controller',
    type: 'EVALUATION', status: 'ISSUED',
    standards: ['EN_18031_1', 'EN_18031_2'],
    pmName: 'Lea Hoffmann', pmInitials: 'LH',
    progressPct: 100,
    startedAt: days(140),
    nextActionForCustomer: 'Download the signed report.',
    hasIssuedReport: true
  }
];

export const CUSTOMER_FINDINGS: CustomerFinding[] = [
  {
    id: 'f-005', code: 'F-2026-005', projectId: 'pr-003',
    title: 'OTA payload not encrypted at rest in storage',
    description: 'During inspection of the Hue Bridge update channel the lab observed that firmware payloads are stored unencrypted on the local file system between download and verification.',
    severity: 'HIGH', status: 'ACCEPTED',
    standards: ['EN_18031_1'],
    recommendation: 'Encrypt staged firmware with AES-256 keyed from the secure element. Wipe stage on verification fail.',
    updatedAt: days(5)
  },
  {
    id: 'f-007', code: 'F-2026-007', projectId: 'pr-001',
    title: 'Stored XSS via device-name field in cloud admin UI',
    description: 'Persisted Cross-Site Scripting was reproducible by setting a device name containing a script tag and viewing the admin dashboard.',
    severity: 'CRITICAL', status: 'RETESTED',
    standards: ['ETSI_EN_303_645'],
    recommendation: 'Sanitize the device-name field on write (server-side) and contextually escape on render.',
    updatedAt: days(1)
  },
  {
    id: 'f-010', code: 'F-2026-010', projectId: 'pr-001',
    title: 'Logging level configurable but defaults to DEBUG',
    description: 'On first boot the controller defaults to DEBUG log verbosity, which writes credentials and tokens to the local journal.',
    severity: 'INFORMATIONAL', status: 'ACCEPTED',
    standards: ['OWASP_IOT_TOP10'],
    recommendation: 'Default to INFO. Document how operators can enable DEBUG temporarily for support.',
    updatedAt: days(6)
  }
];

export const CUSTOMER_REPORTS: CustomerReport[] = [
  {
    id: 'r-001', code: 'R-2025-198',
    projectCode: 'TLG-2025-198',
    productName: 'Tap IP Conference Controller',
    issuedAt: days(8),
    signedBy: 'Dr. Helga Reinhardt',
    sha256: '3f87c0a2ad9b…7f1e'
  }
];

export const CUSTOMER_MESSAGES: CustomerMessage[] = [
  {
    id: 'm-1', projectCode: 'TLG-2026-001',
    from: 'PM', authorName: 'Lea Hoffmann',
    body: 'Critical XSS retested — vendor patch confirmed effective. Will move to FINDINGS_REVIEW after triage call tomorrow.',
    at: days(0), unread: true
  },
  {
    id: 'm-2', projectCode: 'TLG-2026-003',
    from: 'PM', authorName: 'Lea Hoffmann',
    body: 'F-2026-005 mitigation accepted. Please upload the firmware build that contains the fix when ready.',
    at: days(1), unread: true
  },
  {
    id: 'm-3', projectCode: 'TLG-2026-007',
    from: 'PM', authorName: 'Lea Hoffmann',
    body: 'I left the intake form open with the sections you still need to complete. Ping me if anything is unclear.',
    at: days(2), unread: false
  }
];
