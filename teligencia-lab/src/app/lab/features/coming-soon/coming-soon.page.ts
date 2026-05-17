/*
 * ComingSoonPage — polished placeholder for unimplemented lab areas.
 * Reads :area path param and renders an area-specific title + body.
 */

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';

interface AreaCopy { readonly title: string; readonly body: string; }

const AREA_COPY: Record<string, AreaCopy> = {
  projects:    { title: 'Projects workspace',  body: 'Filterable project list, detail tabs (Overview, Intake, Tests, Findings, Reports), and the status timeline. Wired to the gate enforcement service.' },
  findings:    { title: 'Findings ledger',     body: 'Severity grid, customer-visibility gating, CVSS scoring, retest workflow, and batch reviewer approvals.' },
  'test-execution': { title: 'Test execution', body: 'Test plan catalog, PASS/FAIL/NA verdicts per clause, methodology notes, evidence attach.' },
  evidence:    { title: 'Evidence vault',      body: 'SHA-256 verified uploads, MIME-by-content validation, lock toggle (gate G-04), signed-URL downloads.' },
  reports:     { title: 'Reports & signatures', body: 'Draft → reviewer-approved → signatory-issued lifecycle. Gates G-02, G-03, G-05 enforced server-side.' },
  sla:         { title: 'SLA & MA-DD watch',   body: 'Continuous-monitoring contracts, response windows, retest deadlines, quarterly reviews, breach alerts.' },
  standards:   { title: 'Standards library',   body: 'EN 18031-{1,2,3}, ETSI EN 303 645, IEC 62443-4-{1,2}, NIST 8259A, OWASP IoT Top 10 — version tracking + impact analysis.' },
  audit:       { title: 'Audit trail',         body: 'Full immutable ledger (gate G-06). Filterable by actor, action, entity, gate. Read-only forever.' },
  users:       { title: 'Users & roles',       body: 'Lab staff directory, role assignment, Clerk MFA status, on-call rotation, role-aware permission audit.' },
  settings:    { title: 'Settings',            body: 'Organization profile, integrations (Stripe, Resend, Anthropic), retention policy, GDPR controls.' },
  'my-queue':  { title: 'Your work queue',     body: 'Personalized queue: items waiting on you, with one-tap actions. Driven by role-aware "Needs your attention" feed.' },
  'contract-reviews': { title: 'Contract reviews', body: '8-item checklist + decision_rule. Required for gates G-01 and G-02.' }
};

@Component({
  selector: 'app-coming-soon-page',
  standalone: true,
  imports: [RouterLink, NzIconModule, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="head">
      <p class="t-caption">Coming soon</p>
      <h1 class="t-h1">{{ copy().title }}</h1>
    </header>

    <div class="frame">
      <app-empty-state
        [title]="copy().title"
        [body]="copy().body"
        illustration="scope">
        <a class="back" routerLink="/lab/dashboard">
          <i nz-icon nzType="arrow-left" aria-hidden="true"></i>
          Back to dashboard
        </a>
      </app-empty-state>
    </div>
  `,
  styleUrl: './coming-soon.page.scss'
})
export class ComingSoonPage {
  readonly area = input<string>('projects');

  readonly copy = computed<AreaCopy>(() => AREA_COPY[this.area()] ?? {
    title: 'This area is in scaffolding',
    body: 'The module is part of the Teligencia roadmap. Use the sidebar to navigate to a wired-up section.'
  });
}
