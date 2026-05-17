/*
 * Customer-portal domain types — pruned to only what a manufacturer
 * customer is allowed to see (constitution §IX Dual-Portal Parity).
 */

import { FindingStatus, ProjectStatus, ProjectType, Severity, StandardScheme } from './enums';

export interface CustomerProject {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly productName: string;
  readonly type: ProjectType;
  readonly status: ProjectStatus;          /* raw enum, mapped to friendly text in UI */
  readonly standards: StandardScheme[];
  readonly pmName: string;
  readonly pmInitials: string;
  readonly progressPct: number;
  readonly startedAt: string;
  readonly slaDueAt?: string;
  readonly nextActionForCustomer?: string;
  readonly hasIssuedReport: boolean;
}

export interface CustomerFinding {
  readonly id: string;
  readonly code: string;
  readonly projectId: string;
  readonly title: string;
  readonly description: string;
  readonly severity: Severity;
  readonly status: FindingStatus;
  readonly standards: StandardScheme[];
  readonly recommendation?: string;
  readonly updatedAt: string;
}

export interface CustomerReport {
  readonly id: string;
  readonly code: string;
  readonly projectCode: string;
  readonly productName: string;
  readonly issuedAt: string;
  readonly signedBy: string;
  readonly sha256: string;
}

export interface CustomerMessage {
  readonly id: string;
  readonly projectCode: string;
  readonly from: 'PM' | 'You';
  readonly authorName: string;
  readonly body: string;
  readonly at: string;
  readonly unread: boolean;
}
