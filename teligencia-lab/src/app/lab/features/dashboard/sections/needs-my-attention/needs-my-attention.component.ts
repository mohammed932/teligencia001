/*
 * NeedsMyAttention — role-aware card.
 * Lists 3 priority items computed by DashboardDataService based on current role.
 * 4px cyan inset left border, sm shadow, hover lift.
 */

import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { RouterLink } from '@angular/router';
import { DashboardDataService } from '../../../../../core/services/dashboard-data.service';
import { MockSessionService } from '../../../../../core/services/mock-session.service';
import { ROLE_LABELS } from '../../../../../core/models/enums';
import { EmptyStateComponent } from '../../../../../shared/empty-state/empty-state.component';

@Component({
  selector: 'app-needs-my-attention',
  standalone: true,
  imports: [RouterLink, NzIconModule, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="card" aria-labelledby="nma-h">
      <header class="head">
        <div>
          <p class="t-caption eyebrow">Role · {{ roleLabel() }}</p>
          <h2 id="nma-h" class="t-h2">Needs your attention</h2>
        </div>
        <a class="head-link" routerLink="/lab/coming-soon/my-queue">
          Open my queue <i nz-icon nzType="arrow-right" aria-hidden="true"></i>
        </a>
      </header>

      @if (items().length > 0) {
        <ul class="list">
          @for (item of items(); track item.label) {
            <li class="item" [attr.data-tone]="item.tone">
              <a class="item-link" [routerLink]="item.href">
                <span class="count num">{{ item.count }}</span>
                <span class="label">{{ item.label }}</span>
                <i nz-icon nzType="right" class="arrow" aria-hidden="true"></i>
              </a>
            </li>
          }
        </ul>
      } @else {
        <app-empty-state
          title="Inbox zero"
          body="Nothing requires your attention right now. Nice work."
          illustration="inbox-quiet">
        </app-empty-state>
      }
    </section>
  `,
  styleUrl: './needs-my-attention.component.scss'
})
export class NeedsMyAttentionComponent {
  private readonly data = inject(DashboardDataService);
  private readonly session = inject(MockSessionService);

  readonly roleLabel = computed(() => ROLE_LABELS[this.session.currentRole()]);
  readonly items = computed(() => this.data.needsMyAttention() ?? []);
}
