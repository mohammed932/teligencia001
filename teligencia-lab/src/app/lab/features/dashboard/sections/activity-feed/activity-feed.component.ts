/*
 * ActivityFeed — day-grouped timeline of audit events.
 * Groups events by 'Today' / 'Yesterday' / formatted date.
 */

import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { RouterLink } from '@angular/router';
import { DashboardDataService } from '../../../../../core/services/dashboard-data.service';
import { STAFF_BY_ID } from '../../../../../core/mock-data/people';
import { ActivityItemComponent } from '../../../../../shared/activity-item/activity-item.component';
import { EmptyStateComponent } from '../../../../../shared/empty-state/empty-state.component';
import { AuditEvent } from '../../../../../core/models/domain';

interface DayGroup {
  readonly key: string;
  readonly label: string;
  readonly items: AuditEvent[];
}

@Component({
  selector: 'app-activity-feed',
  standalone: true,
  imports: [RouterLink, NzIconModule, ActivityItemComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="card" aria-labelledby="af-h">
      <header class="head">
        <div>
          <h2 id="af-h" class="t-h2">Activity feed</h2>
          <p class="t-small muted">Immutable audit trail · last 72h</p>
        </div>
        <a class="head-link" routerLink="/lab/coming-soon/audit">
          Full audit log <i nz-icon nzType="arrow-right" aria-hidden="true"></i>
        </a>
      </header>

      @if (groups().length > 0) {
        @for (group of groups(); track group.key) {
          <section class="day">
            <h3 class="day-head t-caption">
              <span class="day-label">{{ group.label }}</span>
              <span class="day-count">{{ group.items.length }} event{{ group.items.length === 1 ? '' : 's' }}</span>
            </h3>
            <ul class="day-list">
              @for (ev of group.items; track ev.id) {
                <app-activity-item [event]="ev" [actorName]="actor(ev.actorId)"></app-activity-item>
              }
            </ul>
          </section>
        }
      } @else {
        <app-empty-state
          title="No activity yet"
          body="Every mutation is logged here. As soon as someone moves a project or creates a finding, it shows up."
          illustration="shield-clear">
        </app-empty-state>
      }
    </section>
  `,
  styleUrl: './activity-feed.component.scss'
})
export class ActivityFeedComponent {
  private readonly data = inject(DashboardDataService);

  protected actor = (id: string) => STAFF_BY_ID[id]?.fullName ?? 'System';

  readonly groups = computed<DayGroup[]>(() => {
    const events = this.data.auditEvents();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const ymd = (d: Date) => d.toISOString().slice(0, 10);
    const byDay = new Map<string, AuditEvent[]>();
    for (const ev of events) {
      const d = new Date(ev.at); d.setHours(0, 0, 0, 0);
      const key = ymd(d);
      if (!byDay.has(key)) { byDay.set(key, []); }
      byDay.get(key)!.push(ev);
    }
    const groups: DayGroup[] = [];
    for (const [key, items] of byDay) {
      const d = new Date(key);
      const diff = Math.round((+today - +d) / 86_400_000);
      const label = diff === 0 ? 'Today'
                   : diff === 1 ? 'Yesterday'
                   : d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
      groups.push({ key, label, items });
    }
    return groups.sort((a, b) => (a.key < b.key ? 1 : -1));
  });
}
