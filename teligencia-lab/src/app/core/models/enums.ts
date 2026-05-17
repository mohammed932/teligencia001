/*
 * Business enums — Teligencia.
 * Sourced from Teligencia-LLM-Handoff.md + constitution + prompt directive.
 * Finding status uses the operational ledger names from the prompt.
 */

export type Role =
  | 'lab_admin'
  | 'pm'
  | 'test_engineer'
  | 'reviewer'
  | 'signatory'
  | 'quality_manager';

export const ROLE_LABELS: Record<Role, string> = {
  lab_admin:       'Lab Admin',
  pm:              'Project Manager',
  test_engineer:   'Test Engineer',
  reviewer:        'Reviewer',
  signatory:       'Signatory',
  quality_manager: 'Quality Manager'
};

export type ProjectStatus =
  | 'NEW'
  | 'QUOTE_SENT'
  | 'PO_RECEIVED'
  | 'INTAKE_IN_PROGRESS'
  | 'CONTRACT_REVIEW'
  | 'READY_FOR_TESTING'
  | 'IN_TESTING'
  | 'FINDINGS_REVIEW'
  | 'RETEST'
  | 'REPORT_DRAFT'
  | 'UNDER_REVIEW'
  | 'AWAITING_SIGNATORY'
  | 'ISSUED'
  | 'CLOSED'
  | 'ARCHIVED';

export const PROJECT_STATUS_ORDER: ProjectStatus[] = [
  'NEW', 'QUOTE_SENT', 'PO_RECEIVED', 'INTAKE_IN_PROGRESS', 'CONTRACT_REVIEW',
  'READY_FOR_TESTING', 'IN_TESTING', 'FINDINGS_REVIEW', 'RETEST',
  'REPORT_DRAFT', 'UNDER_REVIEW', 'AWAITING_SIGNATORY',
  'ISSUED', 'CLOSED', 'ARCHIVED'
];

/* Customer-friendly status map (FR-001 in handoff). */
export const STATUS_TEXT_CUSTOMER: Partial<Record<ProjectStatus, string>> = {
  INTAKE_IN_PROGRESS: 'Awaiting your information',
  CONTRACT_REVIEW:    'Lab reviewing your submission',
  IN_TESTING:         'Testing in progress',
  FINDINGS_REVIEW:    'Findings being prepared',
  REPORT_DRAFT:       'Report being drafted',
  ISSUED:             'Report available — download now',
  CLOSED:             'Project complete'
};

/* Raw lab labels for the Lab Portal. */
export const STATUS_LABEL_LAB: Record<ProjectStatus, string> = {
  NEW:                 'New',
  QUOTE_SENT:          'Quote sent',
  PO_RECEIVED:         'PO received',
  INTAKE_IN_PROGRESS:  'Intake in progress',
  CONTRACT_REVIEW:     'Contract review',
  READY_FOR_TESTING:   'Ready for testing',
  IN_TESTING:          'In testing',
  FINDINGS_REVIEW:     'Findings review',
  RETEST:              'Retest',
  REPORT_DRAFT:        'Report draft',
  UNDER_REVIEW:        'Under review',
  AWAITING_SIGNATORY:  'Awaiting signatory',
  ISSUED:              'Issued',
  CLOSED:              'Closed',
  ARCHIVED:            'Archived'
};

export type ProjectType =
  | 'EVALUATION'
  | 'MA_DD'
  | 'SUBSCRIPTION'
  | 'CONSULTING'
  | 'DPP'
  | 'PRE_CERT'
  | 'SBOM_ATTESTATION';

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  EVALUATION:       'Evaluation',
  MA_DD:            'MA-DD',
  SUBSCRIPTION:     'Subscription',
  CONSULTING:       'Consulting',
  DPP:              'DPP',
  PRE_CERT:         'Pre-cert',
  SBOM_ATTESTATION: 'SBOM attestation'
};

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';

export const SEVERITY_ORDER: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL'];

export const SEVERITY_LABELS: Record<Severity, string> = {
  CRITICAL:      'Critical',
  HIGH:          'High',
  MEDIUM:        'Medium',
  LOW:           'Low',
  INFORMATIONAL: 'Info'
};

export type FindingStatus = 'OPEN' | 'IN_REVIEW' | 'ACCEPTED' | 'REJECTED' | 'RETESTED';

export const FINDING_STATUS_LABELS: Record<FindingStatus, string> = {
  OPEN:      'Open',
  IN_REVIEW: 'In review',
  ACCEPTED:  'Accepted',
  REJECTED:  'Rejected',
  RETESTED:  'Retested'
};

export type StandardScheme =
  | 'EN_18031_1'
  | 'EN_18031_2'
  | 'EN_18031_3'
  | 'ETSI_EN_303_645'
  | 'IEC_62443_4_1'
  | 'IEC_62443_4_2'
  | 'NIST_8259A'
  | 'OWASP_IOT_TOP10';

export const STANDARD_LABELS: Record<StandardScheme, string> = {
  EN_18031_1:       'EN 18031-1',
  EN_18031_2:       'EN 18031-2',
  EN_18031_3:       'EN 18031-3',
  ETSI_EN_303_645:  'ETSI EN 303 645',
  IEC_62443_4_1:    'IEC 62443-4-1',
  IEC_62443_4_2:    'IEC 62443-4-2',
  NIST_8259A:       'NIST 8259A',
  OWASP_IOT_TOP10:  'OWASP IoT Top 10'
};

export type Gate = 'G-01' | 'G-02' | 'G-03' | 'G-04' | 'G-05' | 'G-06' | 'G-07' | 'G-08';

export const GATE_DESCRIPTIONS: Record<Gate, string> = {
  'G-01': 'Approved ContractReview required before READY_FOR_TESTING',
  'G-02': 'decision_rule required before report sign',
  'G-03': 'reviewer_approved=true required before report sign',
  'G-04': 'Locked evidence is immutable',
  'G-05': 'ISSUED reports are immutable',
  'G-06': 'audit_log is INSERT-only',
  'G-07': 'AI outputs require human_accepted=true',
  'G-08': 'Customer credentials live in Vault only'
};
