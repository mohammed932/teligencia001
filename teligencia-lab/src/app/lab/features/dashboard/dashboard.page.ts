/*
 * DashboardPage — composes the 6 dashboard sections in order.
 * Renders a 600ms skeleton on first paint, then swaps to real content.
 */

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { MockSessionService } from '../../../core/services/mock-session.service';
import { CurrentUserStore } from '../../../core/auth/current-user.store';
import { GreetingStripComponent } from './sections/greeting-strip/greeting-strip.component';
import { KpiStripComponent } from './sections/kpi-strip/kpi-strip.component';
import { NeedsMyAttentionComponent } from './sections/needs-my-attention/needs-my-attention.component';
import { RecentProjectsComponent } from './sections/recent-projects/recent-projects.component';
import { CriticalFindingsComponent } from './sections/critical-findings/critical-findings.component';
import { SlaWatchComponent } from './sections/sla-watch/sla-watch.component';
import { ActivityFeedComponent } from './sections/activity-feed/activity-feed.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    NzGridModule,
    NzSkeletonModule,
    GreetingStripComponent,
    KpiStripComponent,
    NeedsMyAttentionComponent,
    RecentProjectsComponent,
    CriticalFindingsComponent,
    SlaWatchComponent,
    ActivityFeedComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <div class="skel">
        <nz-skeleton [nzActive]="true" [nzParagraph]="{ rows: 2 }"></nz-skeleton>
        <div class="skel-row">
          <nz-skeleton [nzActive]="true" [nzParagraph]="{ rows: 1 }"></nz-skeleton>
          <nz-skeleton [nzActive]="true" [nzParagraph]="{ rows: 1 }"></nz-skeleton>
          <nz-skeleton [nzActive]="true" [nzParagraph]="{ rows: 1 }"></nz-skeleton>
          <nz-skeleton [nzActive]="true" [nzParagraph]="{ rows: 1 }"></nz-skeleton>
        </div>
        <nz-skeleton [nzActive]="true" [nzParagraph]="{ rows: 3 }"></nz-skeleton>
        <nz-skeleton [nzActive]="true" [nzParagraph]="{ rows: 6 }"></nz-skeleton>
      </div>
    } @else {
      <app-greeting-strip></app-greeting-strip>
      <app-kpi-strip></app-kpi-strip>
      <app-needs-my-attention></app-needs-my-attention>

      <div nz-row [nzGutter]="[24, 24]" class="split">
        <div nz-col [nzXs]="24" [nzLg]="16">
          <app-recent-projects></app-recent-projects>
        </div>
        <div nz-col [nzXs]="24" [nzLg]="8">
          <app-critical-findings></app-critical-findings>
        </div>
      </div>

      @if (session.canSeeSla()) {
        <app-sla-watch></app-sla-watch>
      }

      <app-activity-feed></app-activity-feed>
    }
  `,
  styles: [`
    :host { display: block; }
    .skel { display: flex; flex-direction: column; gap: var(--s-5); }
    .skel-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--s-5); }
    .split { margin-bottom: var(--s-5); }
    @media (max-width: 1023px) {
      .skel-row { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class DashboardPage {
  protected readonly session = inject(MockSessionService);
  private readonly currentUserStore = inject(CurrentUserStore);
  /** Real authenticated user from /auth/me — co-exists with MockSession for now. */
  protected readonly currentUser = this.currentUserStore.currentUser;

  private readonly _loading = signal<boolean>(true);
  readonly loading = computed(() => this._loading());

  constructor() {
    void this.currentUserStore.ensureLoaded();
    setTimeout(() => this._loading.set(false), 600);
  }
}
