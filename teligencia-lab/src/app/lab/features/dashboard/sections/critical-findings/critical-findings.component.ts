/*
 * CriticalFindings — sidebar panel listing top 6 open findings by severity.
 * Empty state uses the single 🎯 emoji exception when zero critical/high.
 */

import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { DashboardDataService } from '../../../../../core/services/dashboard-data.service';
import { SeverityBadgeComponent } from '../../../../../shared/severity-badge/severity-badge.component';
import { FindingStatusPillComponent } from '../../../../../shared/finding-status-pill/finding-status-pill.component';

@Component({
  selector: 'app-critical-findings',
  standalone: true,
  imports: [DatePipe, RouterLink, NzIconModule, SeverityBadgeComponent, FindingStatusPillComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="card" aria-labelledby="cf-h">
      <header class="head">
        <div>
          <h2 id="cf-h" class="t-h2">Findings to address</h2>
          <p class="t-small muted">Open + in review · severity ordered</p>
        </div>
        <a class="head-link" routerLink="/lab/coming-soon/findings">
          All findings <i nz-icon nzType="arrow-right" aria-hidden="true"></i>
        </a>
      </header>

      @if (rows().length > 0) {
        <ul class="list">
          @for (f of rows(); track f.id) {
            <li class="row">
              <a class="row-link" [routerLink]="['/lab/coming-soon/findings', f.id]">
                <div class="head-line">
                  <app-severity-badge [severity]="f.severity" [compact]="true"></app-severity-badge>
                  <span class="title">{{ f.title }}</span>
                </div>
                <div class="meta">
                  <span class="code num">{{ f.code }}</span>
                  <span class="dot" aria-hidden="true">·</span>
                  <app-finding-status-pill [status]="f.status"></app-finding-status-pill>
                  @if (f.cvss) {
                    <span class="dot" aria-hidden="true">·</span>
                    <span class="cvss num">CVSS {{ f.cvss }}</span>
                  }
                  <span class="dot" aria-hidden="true">·</span>
                  <span class="t-small num muted">Updated {{ f.updatedAt | date: 'd MMM' }}</span>
                </div>
              </a>
            </li>
          }
        </ul>
      } @else {
        <div class="zero">
          <span class="zero-emoji" aria-hidden="true">🎯</span>
          <h3 class="t-h2">No open findings</h3>
          <p class="t-body muted">Every open finding is closed, accepted, or rejected. Keep the streak going.</p>
        </div>
      }
    </section>
  `,
  styleUrl: './critical-findings.component.scss'
})
export class CriticalFindingsComponent {
  private readonly data = inject(DashboardDataService);
  readonly rows = computed(() => this.data.topCriticalFindings());
}
