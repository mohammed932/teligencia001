/*
 * SlaWatch — horizontal scroll strip of SLA items.
 * Only rendered when MockSessionService.canSeeSla() is true (pm + lab_admin).
 */

import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { DashboardDataService } from '../../../../../core/services/dashboard-data.service';
import { SlaCountdownComponent } from '../../../../../shared/sla-countdown/sla-countdown.component';

@Component({
  selector: 'app-sla-watch',
  standalone: true,
  imports: [DatePipe, NzIconModule, SlaCountdownComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="card" aria-labelledby="sla-h">
      <header class="head">
        <div>
          <h2 id="sla-h" class="t-h2">SLA & MA-DD watch</h2>
          <p class="t-small muted">Continuous-monitoring contracts · sorted by urgency</p>
        </div>
        <span class="count num">{{ items().length }}</span>
      </header>

      <div class="track" role="list">
        @for (s of items(); track s.id) {
          <article class="chip" role="listitem">
            <div class="chip-head">
              <span class="kind">{{ kindLabel(s.kind) }}</span>
              <span class="type">{{ s.type === 'MA_DD' ? 'MA-DD' : 'Subscription' }}</span>
            </div>
            <div class="chip-body">
              <span class="code num">{{ s.projectCode }}</span>
              <span class="customer">{{ s.customerName }}</span>
            </div>
            <div class="chip-foot">
              <app-sla-countdown [hoursRemaining]="s.hoursRemaining"></app-sla-countdown>
              <span class="due t-small num">Due {{ s.dueAt | date: 'd MMM HH:mm' }}</span>
            </div>
          </article>
        }
      </div>
    </section>
  `,
  styleUrl: './sla-watch.component.scss'
})
export class SlaWatchComponent {
  private readonly data = inject(DashboardDataService);
  readonly items = computed(() => this.data.slaItems());

  protected kindLabel(k: 'response' | 'retest' | 'review'): string {
    switch (k) {
      case 'response': return 'Response window';
      case 'retest':   return 'Retest deadline';
      case 'review':   return 'Quarterly review';
    }
  }
}
