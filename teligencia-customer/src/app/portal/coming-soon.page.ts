/*
 * ComingSoonPage — Customer-portal placeholder for unfinished areas
 * (Intake, Findings, Reports, Messages). Polished, lab-grade copy.
 */

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';

interface AreaCopy { readonly title: string; readonly body: string; readonly illu: 'scope' | 'shield-clear' | 'inbox-quiet' | 'spool' | 'target'; }

const AREA: Record<string, AreaCopy> = {
  intake:   { title: 'Intake form',      body: 'Multi-step product intake with version control and a completeness score. Auto-saves as you go.', illu: 'inbox-quiet' },
  findings: { title: 'Customer-visible findings', body: 'Only findings approved by the lab reviewer appear here, with severity, clause references, and mitigation evidence upload.', illu: 'shield-clear' },
  reports:  { title: 'Issued reports',   body: 'Signed PDFs with verification metadata, SHA-256 hash, and signed-URL downloads. Available only for ISSUED projects.', illu: 'target' },
  messages: { title: 'Messages',         body: 'Q&A channel with your project manager — threaded by project, with read receipts.', illu: 'spool' }
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
        [illustration]="copy().illu">
        <a class="back" routerLink="/portal/projects">
          <i nz-icon nzType="arrow-left" aria-hidden="true"></i>
          Back to projects
        </a>
      </app-empty-state>
    </div>
  `,
  styleUrl: './coming-soon.page.scss'
})
export class ComingSoonPage {
  readonly area = input<string>('intake');
  readonly copy = computed<AreaCopy>(() => AREA[this.area()] ?? AREA['intake']);
}
