/*
 * KpiCard — single dashboard KPI tile.
 * Props:
 *   label (required) — caption text above the number
 *   value (required) — numeric headline
 *   delta (optional) — { dir: 'up'|'down'|'flat', text: '+3 this week' }
 *   tone  (optional) — 'default' | 'danger' | 'success' (tints the value)
 *   icon  (optional) — Ant Design icon name
 */

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';

export type KpiDeltaDir = 'up' | 'down' | 'flat';
export interface KpiDelta { dir: KpiDeltaDir; text: string; }
export type KpiTone = 'default' | 'danger' | 'success';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [NzIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="kpi" [attr.data-tone]="tone">
      <header class="kpi-head">
        <span class="t-caption">{{ label }}</span>
        @if (icon) {
          <span class="kpi-icon" aria-hidden="true">
            <i nz-icon [nzType]="icon"></i>
          </span>
        }
      </header>
      <div class="kpi-value t-number-xl num">{{ value }}</div>
      @if (delta) {
        <footer class="kpi-delta" [attr.data-dir]="delta.dir">
          <i nz-icon [nzType]="deltaIcon()" class="delta-icon" aria-hidden="true"></i>
          <span>{{ delta.text }}</span>
        </footer>
      }
    </article>
  `,
  styleUrl: './kpi-card.component.scss'
})
export class KpiCardComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: number | string;
  @Input() delta?: KpiDelta;
  @Input() tone: KpiTone = 'default';
  @Input() icon?: string;

  deltaIcon(): string {
    switch (this.delta?.dir) {
      case 'up':   return 'rise';
      case 'down': return 'fall';
      default:     return 'minus';
    }
  }
}
