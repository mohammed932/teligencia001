/*
 * Domain interfaces — Teligencia Lab Portal.
 * Read-only shapes consumed by mock data + dashboard sections.
 */

import {
  FindingStatus,
  Gate,
  ProjectStatus,
  ProjectType,
  Role,
  Severity,
  StandardScheme
} from './enums';

export interface Person {
  readonly id: string;
  readonly fullName: string;
  readonly initials: string;
  readonly role: Role;
  readonly title: string;
}

export interface Manufacturer {
  readonly id: string;
  readonly name: string;
}

export interface Product {
  readonly id: string;
  readonly name: string;
  readonly manufacturerId: string;
}

export interface Project {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly manufacturer: Manufacturer;
  readonly product: Product;
  readonly type: ProjectType;
  readonly status: ProjectStatus;
  readonly standards: StandardScheme[];
  readonly pmId: string;
  readonly engineerIds: string[];
  readonly reviewerId?: string;
  readonly signatoryId?: string;
  readonly openFindings: number;
  readonly criticalFindings: number;
  readonly contractReviewApproved: boolean;
  readonly progressPct: number;
  readonly startedAt: string;
  readonly slaDueAt?: string;
  readonly lastActivityAt: string;
}

export interface Finding {
  readonly id: string;
  readonly code: string;
  readonly projectId: string;
  readonly title: string;
  readonly severity: Severity;
  readonly status: FindingStatus;
  readonly cvss?: number;
  readonly standards: StandardScheme[];
  readonly assigneeId: string;
  readonly customerVisible: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type AuditAction =
  | 'project.created'
  | 'project.status_changed'
  | 'contract_review.approved'
  | 'contract_review.rejected'
  | 'finding.created'
  | 'finding.severity_changed'
  | 'finding.approved_for_customer'
  | 'evidence.uploaded'
  | 'evidence.locked'
  | 'report.draft_created'
  | 'report.review_approved'
  | 'report.signed'
  | 'report.issued'
  | 'gate.blocked'
  | 'ai.output.accepted';

export interface AuditEvent {
  readonly id: string;
  readonly actorId: string;
  readonly action: AuditAction;
  readonly entityType: 'project' | 'finding' | 'report' | 'evidence' | 'contract_review';
  readonly entityRef: string;
  readonly projectId?: string;
  readonly summary: string;
  readonly gate?: Gate;
  readonly at: string;
}

export interface SlaItem {
  readonly id: string;
  readonly projectCode: string;
  readonly customerName: string;
  readonly dueAt: string;
  readonly type: 'MA_DD' | 'SUBSCRIPTION';
  readonly kind: 'response' | 'retest' | 'review';
  readonly hoursRemaining: number;
}
