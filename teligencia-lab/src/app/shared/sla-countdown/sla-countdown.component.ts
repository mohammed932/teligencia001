/*
 * SlaCountdown — compact countdown for SLA-watch chips.
 * Props: hoursRemaining (required). Renders human-readable
 * "12h" / "1d 4h" / "BREACHED" + a tone (danger <24h, warning <72h, info ≥72h).
 */

import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-sla-countdown',
  standalone: true,
  imports: [NzIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="sla" [attr.data-tone]="tone()">
      <i nz-icon nzType="clock-circle" aria-hidden="true"></i>
      <span class="num">{{ display() }}</span>
    </span>
  `,
  styleUrl: './sla-countdown.component.scss'
})
export class SlaCountdownComponent {
  private readonly _h = signal<number>(0);
  @Input({ required: true }) set hoursRemaining(v: number) { this._h.set(v); }

  readonly display = computed(() => {
    const h = this._h();
    if (h < 0) { return 'Breached'; }
    if (h < 24) { return `${h}h`; }
    const d = Math.floor(h / 24);
    const r = h % 24;
    return r ? `${d}d ${r}h` : `${d}d`;
  });

  readonly tone = computed<'danger' | 'warning' | 'info'>(() => {
    const h = this._h();
    if (h < 24) { return 'danger'; }
    if (h < 72) { return 'warning'; }
    return 'info';
  });
}
