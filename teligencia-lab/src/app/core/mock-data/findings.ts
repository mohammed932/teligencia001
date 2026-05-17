/*
 * Mock findings — every severity covered. 20 entries.
 * status uses FindingStatus: OPEN/IN_REVIEW/ACCEPTED/REJECTED/RETESTED.
 */

import { Finding } from '../models/domain';

const NOW = Date.now();
const days = (n: number) => new Date(NOW - n * 86_400_000).toISOString();

export const FINDINGS: Finding[] = [
  {
    id: 'f-001', code: 'F-2026-001', projectId: 'pr-001',
    title: 'Default admin credentials accepted on first boot',
    severity: 'CRITICAL', status: 'IN_REVIEW', cvss: 9.4,
    standards: ['EN_18031_1', 'ETSI_EN_303_645'],
    assigneeId: 'u5', customerVisible: false,
    createdAt: days(3), updatedAt: days(0)
  },
  {
    id: 'f-002', code: 'F-2026-002', projectId: 'pr-001',
    title: 'TLS 1.0 negotiated on management port 8443',
    severity: 'HIGH', status: 'OPEN', cvss: 7.5,
    standards: ['EN_18031_1'],
    assigneeId: 'u3', customerVisible: false,
    createdAt: days(2), updatedAt: days(1)
  },
  {
    id: 'f-003', code: 'F-2026-003', projectId: 'pr-002',
    title: 'Firmware update channel lacks signature verification',
    severity: 'CRITICAL', status: 'OPEN', cvss: 9.1,
    standards: ['ETSI_EN_303_645'],
    assigneeId: 'u3', customerVisible: false,
    createdAt: days(4), updatedAt: days(0)
  },
  {
    id: 'f-004', code: 'F-2026-004', projectId: 'pr-002',
    title: 'JWT secret length below 256 bits',
    severity: 'HIGH', status: 'IN_REVIEW', cvss: 7.2,
    standards: ['ETSI_EN_303_645'],
    assigneeId: 'u5', customerVisible: false,
    createdAt: days(6), updatedAt: days(1)
  },
  {
    id: 'f-005', code: 'F-2026-005', projectId: 'pr-003',
    title: 'OTA payload not encrypted at rest in storage',
    severity: 'HIGH', status: 'ACCEPTED', cvss: 6.8,
    standards: ['EN_18031_1'],
    assigneeId: 'u4', customerVisible: true,
    createdAt: days(12), updatedAt: days(5)
  },
  {
    id: 'f-006', code: 'F-2026-006', projectId: 'pr-003',
    title: 'Lack of brute-force lockout on local pairing PIN',
    severity: 'MEDIUM', status: 'IN_REVIEW',
    standards: ['EN_18031_3'],
    assigneeId: 'u6', customerVisible: false,
    createdAt: days(10), updatedAt: days(2)
  },
  {
    id: 'f-007', code: 'F-2026-007', projectId: 'pr-006',
    title: 'Stored XSS via device-name field in cloud admin UI',
    severity: 'CRITICAL', status: 'RETESTED', cvss: 8.6,
    standards: ['ETSI_EN_303_645'],
    assigneeId: 'u3', customerVisible: true,
    createdAt: days(20), updatedAt: days(1)
  },
  {
    id: 'f-008', code: 'F-2026-008', projectId: 'pr-006',
    title: 'Hardcoded HMAC key in firmware image',
    severity: 'HIGH', status: 'OPEN', cvss: 7.9,
    standards: ['ETSI_EN_303_645'],
    assigneeId: 'u3', customerVisible: false,
    createdAt: days(18), updatedAt: days(0)
  },
  {
    id: 'f-009', code: 'F-2026-009', projectId: 'pr-006',
    title: 'Verbose error messages leak internal stack traces',
    severity: 'LOW', status: 'REJECTED',
    standards: ['OWASP_IOT_TOP10'],
    assigneeId: 'u6', customerVisible: false,
    createdAt: days(15), updatedAt: days(7)
  },
  {
    id: 'f-010', code: 'F-2026-010', projectId: 'pr-006',
    title: 'Logging level configurable but defaults to DEBUG',
    severity: 'INFORMATIONAL', status: 'ACCEPTED',
    standards: ['OWASP_IOT_TOP10'],
    assigneeId: 'u5', customerVisible: true,
    createdAt: days(14), updatedAt: days(6)
  },
  {
    id: 'f-011', code: 'F-2026-011', projectId: 'pr-008',
    title: 'No secure boot chain on AC500 firmware loader',
    severity: 'HIGH', status: 'ACCEPTED', cvss: 7.6,
    standards: ['IEC_62443_4_1'],
    assigneeId: 'u4', customerVisible: true,
    createdAt: days(40), updatedAt: days(20)
  },
  {
    id: 'f-012', code: 'F-2026-012', projectId: 'pr-008',
    title: 'PLC web HMI permits clickjacking',
    severity: 'MEDIUM', status: 'ACCEPTED',
    standards: ['IEC_62443_4_1'],
    assigneeId: 'u5', customerVisible: true,
    createdAt: days(38), updatedAt: days(18)
  },
  {
    id: 'f-013', code: 'F-2026-013', projectId: 'pr-009',
    title: 'Patient data field reflected unsanitized in audit XML',
    severity: 'MEDIUM', status: 'IN_REVIEW',
    standards: ['IEC_62443_4_2'],
    assigneeId: 'u5', customerVisible: false,
    createdAt: days(22), updatedAt: days(3)
  },
  {
    id: 'f-014', code: 'F-2026-014', projectId: 'pr-001',
    title: 'Cookie missing Secure + HttpOnly + SameSite flags',
    severity: 'MEDIUM', status: 'OPEN',
    standards: ['EN_18031_1'],
    assigneeId: 'u3', customerVisible: false,
    createdAt: days(5), updatedAt: days(2)
  },
  {
    id: 'f-015', code: 'F-2026-015', projectId: 'pr-001',
    title: 'CORS configuration allows wildcard origin',
    severity: 'LOW', status: 'OPEN',
    standards: ['EN_18031_1'],
    assigneeId: 'u4', customerVisible: false,
    createdAt: days(4), updatedAt: days(1)
  },
  {
    id: 'f-016', code: 'F-2026-016', projectId: 'pr-002',
    title: 'Software version banner exposed pre-auth',
    severity: 'INFORMATIONAL', status: 'OPEN',
    standards: ['ETSI_EN_303_645'],
    assigneeId: 'u3', customerVisible: false,
    createdAt: days(6), updatedAt: days(2)
  },
  {
    id: 'f-017', code: 'F-2026-017', projectId: 'pr-003',
    title: 'Mobile-app traffic skips certificate pinning',
    severity: 'MEDIUM', status: 'RETESTED',
    standards: ['EN_18031_3'],
    assigneeId: 'u6', customerVisible: true,
    createdAt: days(28), updatedAt: days(2)
  },
  {
    id: 'f-018', code: 'F-2026-018', projectId: 'pr-009',
    title: 'Privilege boundaries between HCP roles unclear',
    severity: 'LOW', status: 'IN_REVIEW',
    standards: ['IEC_62443_4_2'],
    assigneeId: 'u5', customerVisible: false,
    createdAt: days(25), updatedAt: days(4)
  },
  {
    id: 'f-019', code: 'F-2026-019', projectId: 'pr-001',
    title: 'Verbose 500 page leaks ORM query',
    severity: 'LOW', status: 'OPEN',
    standards: ['EN_18031_1'],
    assigneeId: 'u4', customerVisible: false,
    createdAt: days(2), updatedAt: days(0)
  },
  {
    id: 'f-020', code: 'F-2026-020', projectId: 'pr-010',
    title: 'NTP server hardcoded — no fallback configured',
    severity: 'INFORMATIONAL', status: 'ACCEPTED',
    standards: ['EN_18031_1'],
    assigneeId: 'u6', customerVisible: true,
    createdAt: days(70), updatedAt: days(30)
  }
];
