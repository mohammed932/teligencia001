/*
 * SeverityBadge — pill that renders a Severity.
 * Props: severity (required), compact (optional, drops label).
 */

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Severity, SEVERITY_LABELS } from '../../core/models/enums';

@Component({
  selector: 'app-severity-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="sev" [attr.data-sev]="severity" [class.compact]="compact" [attr.aria-label]="'Severity ' + label()">
      <span class="bar" aria-hidden="true"></span>
      <span class="text">{{ compact ? short() : label() }}</span>
    </span>
  `,
  styleUrl: './severity-badge.component.scss'
})
export class SeverityBadgeComponent {
  @Input({ required: true }) severity!: Severity;
  @Input() compact = false;

  label(): string { return SEVERITY_LABELS[this.severity]; }

  short(): string {
    return this.severity === 'INFORMATIONAL' ? 'INFO' : this.severity.charAt(0);
  }
}
