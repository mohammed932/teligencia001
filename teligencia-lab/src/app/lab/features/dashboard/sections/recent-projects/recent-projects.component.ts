/*
 * RecentProjects — table-like list of the 8 most recent projects.
 * Custom row markup (not nz-table) for precise typography/spacing.
 * On hover: row tint + chevron reveal.
 */

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { DashboardDataService } from '../../../../../core/services/dashboard-data.service';
import { STAFF_BY_ID } from '../../../../../core/mock-data/people';
import { StatusBadgeComponent } from '../../../../../shared/status-badge/status-badge.component';
import { AvatarComponent } from '../../../../../shared/avatar/avatar.component';
import { EmptyStateComponent } from '../../../../../shared/empty-state/empty-state.component';
import { PROJECT_TYPE_LABELS } from '../../../../../core/models/enums';

@Component({
  selector: 'app-recent-projects',
  standalone: true,
  imports: [RouterLink, DatePipe, NzIconModule, StatusBadgeComponent, AvatarComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="card" aria-labelledby="rp-h">
      <header class="head">
        <div>
          <h2 id="rp-h" class="t-h2">Recent projects</h2>
          <p class="t-small muted">Last activity, newest first</p>
        </div>
        <a class="head-link" routerLink="/lab/coming-soon/projects">
          All projects <i nz-icon nzType="arrow-right" aria-hidden="true"></i>
        </a>
      </header>

      @if (rows().length > 0) {
        <div class="grid-head t-caption">
          <span class="col-code">Project</span>
          <span class="col-type">Type</span>
          <span class="col-status">Status</span>
          <span class="col-progress">Progress</span>
          <span class="col-team">PM</span>
          <span class="col-activity">Activity</span>
        </div>

        <ul class="rows">
          @for (p of rows(); track p.id) {
            <li class="row">
              <a class="row-link" [routerLink]="['/lab/coming-soon/projects', p.id]">
                <div class="col-code">
                  <span class="code num">{{ p.code }}</span>
                  <span class="title">{{ p.title }}</span>
                  <span class="manu">{{ p.manufacturer.name }}</span>
                </div>
                <div class="col-type">
                  <span class="type-chip">{{ typeLabel(p.type) }}</span>
                </div>
                <div class="col-status">
                  <app-status-badge [status]="p.status"></app-status-badge>
                </div>
                <div class="col-progress">
                  <div class="bar" [attr.aria-label]="'Progress ' + p.progressPct + '%'">
                    <span class="bar-fill" [style.width.%]="p.progressPct"></span>
                  </div>
                  <span class="t-small num">{{ p.progressPct }}%</span>
                </div>
                <div class="col-team">
                  <app-avatar [name]="pmName(p.pmId)" size="sm"></app-avatar>
                </div>
                <div class="col-activity t-small num">
                  {{ p.lastActivityAt | date: 'd MMM' }}
                </div>
                <i nz-icon nzType="right" class="arrow" aria-hidden="true"></i>
              </a>
            </li>
          }
        </ul>
      } @else {
        <app-empty-state
          title="No recent activity"
          body="When projects move through the pipeline they appear here, sorted by latest activity."
          illustration="spool">
        </app-empty-state>
      }
    </section>
  `,
  styleUrl: './recent-projects.component.scss'
})
export class RecentProjectsComponent {
  private readonly data = inject(DashboardDataService);
  protected readonly rows = this.data.recentProjects;

  protected typeLabel = (t: keyof typeof PROJECT_TYPE_LABELS) => PROJECT_TYPE_LABELS[t];
  protected pmName(id: string): string {
    return STAFF_BY_ID[id]?.fullName ?? 'Unassigned';
  }
}
