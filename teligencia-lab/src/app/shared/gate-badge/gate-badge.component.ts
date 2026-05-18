/*
 * <app-gate-badge> — ISO 17025 gate state indicator.
 *
 * TL-UX-001 §1.7: shield-check icon + green when the gate has passed;
 * shield-alert icon + amber/red when blocked or pending. The gate IDs
 * (G-01..G-08) come from the Teligencia constitution Article III Rule 1.
 *
 * Usage:
 *   <app-gate-badge gate="G-01" [state]="'open'" label="Contract Review Approved — Testing Authorized"></app-gate-badge>
 *   <app-gate-badge gate="G-03" [state]="'pending'" label="Reviewer Approval Pending"></app-gate-badge>
 *   <app-gate-badge gate="G-06" [state]="'blocked'" label="Audit log integrity check failed"></app-gate-badge>
 */

import {
  ChangeDetectionStrategy,
  Component,
  Input,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';

export type GateState = 'open' | 'pending' | 'blocked';

@Component({
  selector: 'app-gate-badge',
  standalone: true,
  imports: [NgClass, NzIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="gate" [ngClass]="state" role="status" [attr.aria-label]="ariaLabel()">
      <i
        nz-icon
        [nzType]="state === 'open' ? 'safety' : 'warning'"
        nzTheme="outline"
        class="gate-ico"
        aria-hidden="true"
      ></i>
      @if (gate) {
        <span class="gate-id t-mono">{{ gate }}</span>
      }
      <span class="gate-label">{{ label }}</span>
    </span>
  `,
  styles: [
    `
      :host { display: inline-block; }

      .gate {
        display: inline-flex;
        align-items: center;
        gap: var(--s-2);
        padding: var(--s-2) var(--s-3);
        border-radius: var(--radius-md);
        font-size: 13px;
        font-weight: 600;
        line-height: 1.2;
        border: 1px solid transparent;
        white-space: nowrap;
      }

      .gate.open {
        background: rgba(5, 150, 105, 0.10);
        color: var(--color-iso);
        border-color: rgba(5, 150, 105, 0.30);
      }
      .gate.pending {
        background: rgba(217, 119, 6, 0.10);
        color: var(--color-warning);
        border-color: rgba(217, 119, 6, 0.30);
      }
      .gate.blocked {
        background: rgba(220, 38, 38, 0.10);
        color: var(--color-danger);
        border-color: rgba(220, 38, 38, 0.30);
      }

      .gate-ico { font-size: 16px; }

      .gate-id {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.08em;
        opacity: 0.85;
      }

      .gate-label { white-space: normal; }

      :root[data-theme='dark'] .gate.open {
        background: rgba(16, 185, 129, 0.18);
        border-color: rgba(16, 185, 129, 0.45);
      }
      :root[data-theme='dark'] .gate.pending {
        background: rgba(245, 158, 11, 0.18);
        border-color: rgba(245, 158, 11, 0.45);
      }
      :root[data-theme='dark'] .gate.blocked {
        background: rgba(248, 113, 113, 0.18);
        border-color: rgba(248, 113, 113, 0.45);
      }
    `,
  ],
})
export class GateBadgeComponent {
  /** Gate identifier from Constitution Article III Rule 1 (e.g. 'G-01'). */
  @Input() gate: string | null = null;

  /** Short human-readable label, e.g. 'Contract Review Approved'. */
  @Input() label = '';

  /** open = green check · pending = amber · blocked = red */
  @Input() state: GateState = 'pending';

  ariaLabel(): string {
    const prefix = this.gate ? `${this.gate} ` : '';
    return `${prefix}${this.label} (${this.state})`;
  }
}
