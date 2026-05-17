/*
 * DashboardDataService — pure mock data accessors with derived KPIs.
 * Returns signals so consumers re-compute on role change.
 */

import { Injectable, computed, inject } from '@angular/core';
import { PROJECTS } from '../mock-data/projects';
import { FINDINGS } from '../mock-data/findings';
import { AUDIT_EVENTS } from '../mock-data/audit';
import { SLA_ITEMS } from '../mock-data/sla';
import { STAFF_BY_ID } from '../mock-data/people';
import { MockSessionService } from './mock-session.service';
import { Project, Finding, AuditEvent } from '../models/domain';

@Injectable({ providedIn: 'root' })
export class DashboardDataService {
  private session = inject(MockSessionService);

  /** All open (non-terminal) projects. */
  readonly openProjects = computed<Project[]>(() =>
    PROJECTS.filter(p => p.status !== 'CLOSED' && p.status !== 'ARCHIVED')
  );

  /** Active testing pipeline (excludes terminal + pre-contract). */
  readonly activeTesting = computed<Project[]>(() =>
    PROJECTS.filter(p => p.status === 'IN_TESTING' || p.status === 'RETEST' || p.status === 'FINDINGS_REVIEW')
  );

  /** Findings currently open + critical. */
  readonly openFindings = computed<Finding[]>(() =>
    FINDINGS.filter(f => f.status === 'OPEN' || f.status === 'IN_REVIEW')
  );
  readonly criticalOpenFindings = computed<Finding[]>(() =>
    this.openFindings().filter(f => f.severity === 'CRITICAL' || f.severity === 'HIGH')
  );

  /** Reports awaiting signature. */
  readonly awaitingSignature = computed<Project[]>(() =>
    PROJECTS.filter(p => p.status === 'AWAITING_SIGNATORY' || p.status === 'UNDER_REVIEW')
  );

  /** Recent projects: last activity desc, top 8. */
  readonly recentProjects = computed<Project[]>(() =>
    [...PROJECTS]
      .filter(p => p.status !== 'ARCHIVED')
      .sort((a, b) => +new Date(b.lastActivityAt) - +new Date(a.lastActivityAt))
      .slice(0, 8)
  );

  /** Critical / high findings, severity then date. */
  readonly topCriticalFindings = computed<Finding[]>(() => {
    const rank = (s: Finding['severity']) =>
      s === 'CRITICAL' ? 0 : s === 'HIGH' ? 1 : s === 'MEDIUM' ? 2 : s === 'LOW' ? 3 : 4;
    return [...FINDINGS]
      .filter(f => f.status === 'OPEN' || f.status === 'IN_REVIEW')
      .sort((a, b) => rank(a.severity) - rank(b.severity) || +new Date(b.updatedAt) - +new Date(a.updatedAt))
      .slice(0, 6);
  });

  readonly auditEvents = computed<AuditEvent[]>(() =>
    [...AUDIT_EVENTS].sort((a, b) => +new Date(b.at) - +new Date(a.at))
  );

  readonly slaItems = computed(() =>
    [...SLA_ITEMS].sort((a, b) => a.hoursRemaining - b.hoursRemaining)
  );

  /** Role-aware "Needs your attention" — different bullets per role. */
  readonly needsMyAttention = computed(() => {
    const role = this.session.currentRole();
    const me = this.session.currentUser();

    switch (role) {
      case 'pm': {
        const blocked = PROJECTS.filter(p => p.status === 'INTAKE_IN_PROGRESS' || p.status === 'CONTRACT_REVIEW' && !p.contractReviewApproved);
        const ready   = PROJECTS.filter(p => p.status === 'PO_RECEIVED');
        const slaSoon = SLA_ITEMS.filter(s => s.hoursRemaining <= 24);
        return [
          { label: 'Awaiting customer intake',         count: blocked.length, href: '/lab/projects?status=INTAKE_IN_PROGRESS', tone: 'warning' as const },
          { label: 'POs received — quote next steps',  count: ready.length,   href: '/lab/projects?status=PO_RECEIVED',        tone: 'info' as const },
          { label: 'SLA breaches in next 24h',         count: slaSoon.length, href: '/lab/sla',                                 tone: 'danger' as const }
        ];
      }
      case 'lab_admin': {
        const blocked = PROJECTS.filter(p => p.status === 'CONTRACT_REVIEW' && !p.contractReviewApproved);
        const awaitingSig = PROJECTS.filter(p => p.status === 'AWAITING_SIGNATORY');
        return [
          { label: 'Contract reviews pending approval', count: blocked.length, href: '/lab/contract-reviews', tone: 'warning' as const },
          { label: 'Awaiting signatory action',         count: awaitingSig.length, href: '/lab/reports',         tone: 'info' as const },
          { label: 'Open critical findings (lab-wide)', count: FINDINGS.filter(f => f.severity === 'CRITICAL' && f.status !== 'ACCEPTED' && f.status !== 'REJECTED').length, href: '/lab/findings?severity=CRITICAL', tone: 'danger' as const }
        ];
      }
      case 'test_engineer': {
        const mine = PROJECTS.filter(p => p.engineerIds.includes(me.id) && (p.status === 'IN_TESTING' || p.status === 'RETEST'));
        const findingsAssigned = FINDINGS.filter(f => f.assigneeId === me.id && (f.status === 'OPEN' || f.status === 'IN_REVIEW'));
        return [
          { label: 'Projects on your bench',          count: mine.length, href: '/lab/projects?assignee=me', tone: 'info' as const },
          { label: 'Findings assigned to you',         count: findingsAssigned.length, href: '/lab/findings?assignee=me', tone: 'warning' as const },
          { label: 'Evidence awaiting upload', count: 4, href: '/lab/evidence', tone: 'info' as const }
        ];
      }
      case 'reviewer': {
        const inReview = FINDINGS.filter(f => f.status === 'IN_REVIEW' && f.assigneeId === me.id);
        const draftReports = PROJECTS.filter(p => p.status === 'UNDER_REVIEW' && p.reviewerId === me.id);
        return [
          { label: 'Findings awaiting your review', count: inReview.length,     href: '/lab/findings?status=IN_REVIEW', tone: 'warning' as const },
          { label: 'Reports under your review',     count: draftReports.length, href: '/lab/reports?status=UNDER_REVIEW', tone: 'info' as const },
          { label: 'Severity escalations to confirm', count: 2,                  href: '/lab/findings?flag=escalated', tone: 'danger' as const }
        ];
      }
      case 'signatory': {
        const awaiting = PROJECTS.filter(p => p.status === 'AWAITING_SIGNATORY' && p.signatoryId === me.id);
        return [
          { label: 'Reports awaiting your signature', count: awaiting.length, href: '/lab/reports?status=AWAITING_SIGNATORY', tone: 'danger' as const },
          { label: 'Reports issued this month',       count: PROJECTS.filter(p => p.status === 'ISSUED').length, href: '/lab/reports?status=ISSUED', tone: 'info' as const },
          { label: 'Decision-rule checks (G-02)',     count: 1, href: '/lab/contract-reviews?gate=G-02', tone: 'warning' as const }
        ];
      }
      case 'quality_manager': {
        const blockedGates = AUDIT_EVENTS.filter(a => a.action === 'gate.blocked').length;
        return [
          { label: 'Gate-blocked attempts (rolling)', count: blockedGates, href: '/lab/audit?action=gate.blocked', tone: 'danger' as const },
          { label: 'AI outputs pending human accept', count: 3,             href: '/lab/audit?action=ai.output.accepted', tone: 'warning' as const },
          { label: 'Audit anomalies flagged',         count: 0,             href: '/lab/audit?flag=anomaly', tone: 'info' as const }
        ];
      }
    }
  });

  readonly kpis = computed(() => ({
    activeProjects:      this.openProjects().length,
    testingInProgress:   this.activeTesting().length,
    criticalOpen:        this.criticalOpenFindings().length,
    awaitingSignature:   this.awaitingSignature().length
  }));

  /** Convenience: resolve actor for an audit event. */
  actor(id: string) { return STAFF_BY_ID[id]; }
}
