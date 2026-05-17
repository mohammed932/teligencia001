/*
 * StatusBadge — pill that renders a ProjectStatus.
 * Props: status (required), variant ('lab' | 'customer' — default 'lab').
 * Lab variant prints the raw enum label; customer variant prints
 * the customer-friendly text from STATUS_TEXT_CUSTOMER.
 */

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ProjectStatus, STATUS_LABEL_LAB, STATUS_TEXT_CUSTOMER } from '../../core/models/enums';

type Variant = 'lab' | 'customer';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="badge" [attr.data-status]="status" role="status" [attr.aria-label]="label()">
      <span class="dot" aria-hidden="true"></span>
      {{ label() }}
    </span>
  `,
  styleUrl: './status-badge.component.scss'
})
export class StatusBadgeComponent {
  @Input({ required: true }) status!: ProjectStatus;
  @Input() variant: Variant = 'lab';

  label(): string {
    if (this.variant === 'customer') {
      return STATUS_TEXT_CUSTOMER[this.status] ?? STATUS_LABEL_LAB[this.status];
    }
    return STATUS_LABEL_LAB[this.status];
  }
}
