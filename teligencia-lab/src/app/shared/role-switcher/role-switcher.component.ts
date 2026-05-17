/*
 * RoleSwitcher — dropdown for switching the simulated current user
 * (and thus current role) via MockSessionService.
 * Tells the user this is a demo affordance, not a Clerk org switcher.
 */

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { AvatarComponent } from '../avatar/avatar.component';
import { MockSessionService } from '../../core/services/mock-session.service';
import { ROLE_LABELS } from '../../core/models/enums';

@Component({
  selector: 'app-role-switcher',
  standalone: true,
  imports: [NzDropDownModule, NzIconModule, AvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rs">
      <button class="rs-trigger" nz-dropdown [nzDropdownMenu]="menu" nzTrigger="click" type="button">
        <app-avatar [name]="session.currentUser().fullName" size="md"></app-avatar>
        <span class="rs-id">
          <span class="rs-name">{{ session.currentUser().fullName }}</span>
          <span class="rs-role t-small">{{ roleLabel(session.currentRole()) }}</span>
        </span>
        <i nz-icon nzType="caret-down" class="rs-caret" aria-hidden="true"></i>
      </button>

      <nz-dropdown-menu #menu="nzDropdownMenu">
        <ul class="rs-menu" role="menu">
          <li class="rs-menu-head t-caption">Switch simulated user</li>
          @for (p of session.directory; track p.id) {
            <li class="rs-menu-item"
                role="menuitem"
                [class.active]="p.id === session.currentUser().id"
                tabindex="0"
                (click)="select(p.id)"
                (keyup.enter)="select(p.id)">
              <app-avatar [name]="p.fullName" size="sm"></app-avatar>
              <span class="rs-menu-name">
                <span class="rs-menu-fullname">{{ p.fullName }}</span>
                <span class="rs-menu-meta">{{ p.title }} · {{ roleLabel(p.role) }}</span>
              </span>
              @if (p.id === session.currentUser().id) {
                <i nz-icon nzType="check-circle" class="rs-check" aria-label="Currently active"></i>
              }
            </li>
          }
          <li class="rs-menu-foot">
            <span class="t-small foot-text">Demo control · simulated session</span>
          </li>
        </ul>
      </nz-dropdown-menu>
    </div>
  `,
  styleUrl: './role-switcher.component.scss'
})
export class RoleSwitcherComponent {
  protected readonly session = inject(MockSessionService);
  protected roleLabel = (r: string) => ROLE_LABELS[r as keyof typeof ROLE_LABELS];
  select(id: string) { this.session.switchUser(id); }
}
