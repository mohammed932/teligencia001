/*
 * KpiStrip — 4 KpiCards in an ng-zorro row with 24px gutter.
 * Collapses 4-up → 2x2 below 1100px and below 768px.
 */

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { KpiCardComponent } from '../../../../../shared/kpi-card/kpi-card.component';
import { DashboardDataService } from '../../../../../core/services/dashboard-data.service';

@Component({
  selector: 'app-kpi-strip',
  standalone: true,
  imports: [NzGridModule, KpiCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="kpis" aria-label="Key performance indicators">
      <div nz-row [nzGutter]="[24, 24]">
        <div nz-col [nzXs]="24" [nzSm]="12" [nzXl]="6">
          <app-kpi-card label="Active projects"
                        [value]="data.kpis().activeProjects"
                        icon="folder-open"
                        [delta]="{ dir: 'up', text: '+2 this week' }"></app-kpi-card>
        </div>
        <div nz-col [nzXs]="24" [nzSm]="12" [nzXl]="6">
          <app-kpi-card label="Testing in progress"
                        [value]="data.kpis().testingInProgress"
                        icon="experiment"
                        [delta]="{ dir: 'flat', text: 'unchanged' }"></app-kpi-card>
        </div>
        <div nz-col [nzXs]="24" [nzSm]="12" [nzXl]="6">
          <app-kpi-card label="Critical / high findings"
                        [value]="data.kpis().criticalOpen"
                        icon="alert"
                        tone="danger"
                        [delta]="{ dir: 'down', text: '−1 vs last week' }"></app-kpi-card>
        </div>
        <div nz-col [nzXs]="24" [nzSm]="12" [nzXl]="6">
          <app-kpi-card label="Awaiting signature"
                        [value]="data.kpis().awaitingSignature"
                        icon="safety-certificate"
                        [delta]="{ dir: 'up', text: '+1 today' }"></app-kpi-card>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; margin-bottom: var(--s-5); }
  `]
})
export class KpiStripComponent {
  protected readonly data = inject(DashboardDataService);
}
