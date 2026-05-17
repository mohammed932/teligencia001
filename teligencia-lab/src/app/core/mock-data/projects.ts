/*
 * Mock projects — every project_status enum value covered at least once.
 * 15 projects, mixed types/manufacturers. Realistic, lab-grade copy only.
 */

import { Project } from '../models/domain';
import { MANUFACTURERS_BY_ID, PRODUCTS_BY_ID } from './manufacturers';

const NOW = Date.now();
const days = (n: number) => new Date(NOW - n * 86_400_000).toISOString();
const future = (n: number) => new Date(NOW + n * 86_400_000).toISOString();

export const PROJECTS: Project[] = [
  {
    id: 'pr-001', code: 'TLG-2026-001',
    title: 'EN 18031-1 evaluation — Smart Home Controller Gen-3',
    manufacturer: MANUFACTURERS_BY_ID['m-bosch'], product: PRODUCTS_BY_ID['p-1'],
    type: 'EVALUATION', status: 'IN_TESTING',
    standards: ['EN_18031_1', 'EN_18031_2'],
    pmId: 'u2', engineerIds: ['u3', 'u4'], reviewerId: 'u5', signatoryId: 'u7',
    openFindings: 11, criticalFindings: 2,
    contractReviewApproved: true, progressPct: 62,
    startedAt: days(28), slaDueAt: future(9), lastActivityAt: days(0)
  },
  {
    id: 'pr-002', code: 'TLG-2026-002',
    title: 'ETSI EN 303 645 — SmartThings Hub V4',
    manufacturer: MANUFACTURERS_BY_ID['m-samsung'], product: PRODUCTS_BY_ID['p-2'],
    type: 'EVALUATION', status: 'FINDINGS_REVIEW',
    standards: ['ETSI_EN_303_645'],
    pmId: 'u2', engineerIds: ['u3'], reviewerId: 'u5', signatoryId: 'u7',
    openFindings: 7, criticalFindings: 1,
    contractReviewApproved: true, progressPct: 78,
    startedAt: days(45), slaDueAt: future(4), lastActivityAt: days(0)
  },
  {
    id: 'pr-003', code: 'TLG-2026-003',
    title: 'MA-DD continuous monitoring — Hue Bridge 2.1',
    manufacturer: MANUFACTURERS_BY_ID['m-philips'], product: PRODUCTS_BY_ID['p-3'],
    type: 'MA_DD', status: 'IN_TESTING',
    standards: ['EN_18031_1', 'EN_18031_3'],
    pmId: 'u2', engineerIds: ['u4'], reviewerId: 'u6',
    openFindings: 3, criticalFindings: 0,
    contractReviewApproved: true, progressPct: 41,
    startedAt: days(60), slaDueAt: future(2), lastActivityAt: days(0)
  },
  {
    id: 'pr-004', code: 'TLG-2026-004',
    title: 'IEC 62443-4-2 pre-cert — SIMATIC IoT Gateway',
    manufacturer: MANUFACTURERS_BY_ID['m-siemens'], product: PRODUCTS_BY_ID['p-4'],
    type: 'PRE_CERT', status: 'CONTRACT_REVIEW',
    standards: ['IEC_62443_4_1', 'IEC_62443_4_2'],
    pmId: 'u2', engineerIds: [],
    openFindings: 0, criticalFindings: 0,
    contractReviewApproved: false, progressPct: 12,
    startedAt: days(6), lastActivityAt: days(1)
  },
  {
    id: 'pr-005', code: 'TLG-2026-005',
    title: 'EN 18031-1 evaluation — Archer AX73 Router',
    manufacturer: MANUFACTURERS_BY_ID['m-tplink'], product: PRODUCTS_BY_ID['p-5'],
    type: 'EVALUATION', status: 'READY_FOR_TESTING',
    standards: ['EN_18031_1'],
    pmId: 'u2', engineerIds: ['u3', 'u4'], reviewerId: 'u5',
    openFindings: 0, criticalFindings: 0,
    contractReviewApproved: true, progressPct: 22,
    startedAt: days(10), lastActivityAt: days(1)
  },
  {
    id: 'pr-006', code: 'TLG-2026-006',
    title: 'ETSI EN 303 645 — Mi Smart Camera 2K Pro',
    manufacturer: MANUFACTURERS_BY_ID['m-xiaomi'], product: PRODUCTS_BY_ID['p-6'],
    type: 'EVALUATION', status: 'RETEST',
    standards: ['ETSI_EN_303_645'],
    pmId: 'u2', engineerIds: ['u3'], reviewerId: 'u6', signatoryId: 'u7',
    openFindings: 4, criticalFindings: 1,
    contractReviewApproved: true, progressPct: 70,
    startedAt: days(52), slaDueAt: future(1), lastActivityAt: days(0)
  },
  {
    id: 'pr-007', code: 'TLG-2026-007',
    title: 'DPP attestation — T6 Pro Thermostat',
    manufacturer: MANUFACTURERS_BY_ID['m-honeywell'], product: PRODUCTS_BY_ID['p-7'],
    type: 'DPP', status: 'INTAKE_IN_PROGRESS',
    standards: ['EN_18031_1'],
    pmId: 'u2', engineerIds: [],
    openFindings: 0, criticalFindings: 0,
    contractReviewApproved: false, progressPct: 5,
    startedAt: days(3), lastActivityAt: days(0)
  },
  {
    id: 'pr-008', code: 'TLG-2026-008',
    title: 'IEC 62443-4-1 evaluation — AC500 PLC Module',
    manufacturer: MANUFACTURERS_BY_ID['m-abb'], product: PRODUCTS_BY_ID['p-8'],
    type: 'EVALUATION', status: 'REPORT_DRAFT',
    standards: ['IEC_62443_4_1'],
    pmId: 'u2', engineerIds: ['u4'], reviewerId: 'u5', signatoryId: 'u7',
    openFindings: 2, criticalFindings: 0,
    contractReviewApproved: true, progressPct: 88,
    startedAt: days(70), lastActivityAt: days(0)
  },
  {
    id: 'pr-009', code: 'TLG-2026-009',
    title: 'Medical device evaluation — Patient Monitor Vista 300',
    manufacturer: MANUFACTURERS_BY_ID['m-drager'], product: PRODUCTS_BY_ID['p-9'],
    type: 'EVALUATION', status: 'UNDER_REVIEW',
    standards: ['IEC_62443_4_2', 'EN_18031_2'],
    pmId: 'u2', engineerIds: ['u3'], reviewerId: 'u5', signatoryId: 'u7',
    openFindings: 1, criticalFindings: 0,
    contractReviewApproved: true, progressPct: 92,
    startedAt: days(82), lastActivityAt: days(1)
  },
  {
    id: 'pr-010', code: 'TLG-2026-010',
    title: 'EN 18031-1 — BPM Connect Pro',
    manufacturer: MANUFACTURERS_BY_ID['m-withings'], product: PRODUCTS_BY_ID['p-10'],
    type: 'SUBSCRIPTION', status: 'AWAITING_SIGNATORY',
    standards: ['EN_18031_1'],
    pmId: 'u2', engineerIds: ['u4'], reviewerId: 'u6', signatoryId: 'u7',
    openFindings: 0, criticalFindings: 0,
    contractReviewApproved: true, progressPct: 95,
    startedAt: days(96), slaDueAt: future(3), lastActivityAt: days(0)
  },
  {
    id: 'pr-011', code: 'TLG-2026-011',
    title: 'SBOM attestation — Era 300 Smart Speaker',
    manufacturer: MANUFACTURERS_BY_ID['m-sonos'], product: PRODUCTS_BY_ID['p-11'],
    type: 'SBOM_ATTESTATION', status: 'ISSUED',
    standards: ['NIST_8259A'],
    pmId: 'u2', engineerIds: ['u3'], reviewerId: 'u6', signatoryId: 'u7',
    openFindings: 0, criticalFindings: 0,
    contractReviewApproved: true, progressPct: 100,
    startedAt: days(110), lastActivityAt: days(2)
  },
  {
    id: 'pr-012', code: 'TLG-2025-198',
    title: 'EN 18031 evaluation — Tap IP Conference Controller',
    manufacturer: MANUFACTURERS_BY_ID['m-logitech'], product: PRODUCTS_BY_ID['p-12'],
    type: 'EVALUATION', status: 'CLOSED',
    standards: ['EN_18031_1', 'EN_18031_2'],
    pmId: 'u2', engineerIds: ['u4'], reviewerId: 'u5', signatoryId: 'u7',
    openFindings: 0, criticalFindings: 0,
    contractReviewApproved: true, progressPct: 100,
    startedAt: days(140), lastActivityAt: days(8)
  },
  {
    id: 'pr-013', code: 'TLG-2025-141',
    title: 'Consulting — Eve Energy Strip readiness review',
    manufacturer: MANUFACTURERS_BY_ID['m-eve'], product: PRODUCTS_BY_ID['p-13'],
    type: 'CONSULTING', status: 'ARCHIVED',
    standards: ['ETSI_EN_303_645'],
    pmId: 'u2', engineerIds: ['u3'],
    openFindings: 0, criticalFindings: 0,
    contractReviewApproved: true, progressPct: 100,
    startedAt: days(220), lastActivityAt: days(30)
  },
  {
    id: 'pr-014', code: 'TLG-2026-012',
    title: 'EcoStruxure Building Gateway — quote',
    manufacturer: MANUFACTURERS_BY_ID['m-schneider'], product: PRODUCTS_BY_ID['p-14'],
    type: 'EVALUATION', status: 'QUOTE_SENT',
    standards: ['IEC_62443_4_2'],
    pmId: 'u2', engineerIds: [],
    openFindings: 0, criticalFindings: 0,
    contractReviewApproved: false, progressPct: 4,
    startedAt: days(2), lastActivityAt: days(0)
  },
  {
    id: 'pr-015', code: 'TLG-2026-013',
    title: 'EV Charger evaluation — Bosch CCS',
    manufacturer: MANUFACTURERS_BY_ID['m-bosch'], product: PRODUCTS_BY_ID['p-15'],
    type: 'EVALUATION', status: 'PO_RECEIVED',
    standards: ['EN_18031_1', 'IEC_62443_4_2'],
    pmId: 'u2', engineerIds: [],
    openFindings: 0, criticalFindings: 0,
    contractReviewApproved: false, progressPct: 8,
    startedAt: days(4), lastActivityAt: days(0)
  },
  {
    id: 'pr-016', code: 'TLG-2026-014',
    title: 'New evaluation request — undecided product',
    manufacturer: MANUFACTURERS_BY_ID['m-bosch'], product: PRODUCTS_BY_ID['p-1'],
    type: 'EVALUATION', status: 'NEW',
    standards: [],
    pmId: 'u2', engineerIds: [],
    openFindings: 0, criticalFindings: 0,
    contractReviewApproved: false, progressPct: 0,
    startedAt: days(0), lastActivityAt: days(0)
  }
];
