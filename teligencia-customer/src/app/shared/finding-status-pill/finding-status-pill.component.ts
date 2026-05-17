/*
 * FindingStatusPill — small status pill for findings.
 * Props: status (required).
 */

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FINDING_STATUS_LABELS, FindingStatus } from '../../core/models/enums';

@Component({
  selector: 'app-finding-status-pill',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="pill" [attr.data-fs]="status">{{ label() }}</span>`,
  styleUrl: './finding-status-pill.component.scss'
})
export class FindingStatusPillComponent {
  @Input({ required: true }) status!: FindingStatus;
  label(): string { return FINDING_STATUS_LABELS[this.status]; }
}
