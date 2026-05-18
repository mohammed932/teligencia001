/*
 * <app-ai-content> — MANDATORY wrapper for every AI-generated artifact
 * surfaced in the Lab Portal or Customer Portal.
 *
 * TL-UX-001 §1.6 + Gate G-07: AI output that has not been accepted by a
 * human must be visibly distinct (purple background + purple left border
 * + "verify with a Teligencia engineer" disclaimer). Un-reviewed AI
 * content also shows an AI_DRAFT badge and, in report context, blocks
 * report issuance.
 */

import {
  ChangeDetectionStrategy,
  Component,
  Input,
} from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';

@Component({
  selector: 'app-ai-content',
  standalone: true,
  imports: [NzIconModule, NzTagModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ai" role="region" aria-label="AI-generated content">
      <header class="ai-head">
        <span class="ai-mark" aria-hidden="true">
          <i nz-icon nzType="robot" nzTheme="outline"></i>
        </span>
        <span class="ai-label">AI-generated — verify with a Teligencia engineer.</span>
        @if (!reviewed) {
          <nz-tag class="ai-draft-tag">AI DRAFT</nz-tag>
        }
        @if (feature) {
          <span class="ai-feature t-mono">{{ feature }}</span>
        }
      </header>
      <div class="ai-body">
        <ng-content></ng-content>
      </div>
      @if (!reviewed) {
        <footer class="ai-foot">
          <i nz-icon nzType="exclamation-circle" nzTheme="outline" aria-hidden="true"></i>
          <span>Pending human review — must be accepted before use in any official record.</span>
        </footer>
      }
    </section>
  `,
  styles: [
    `
      :host { display: block; }

      .ai {
        background: var(--color-ai-bg);
        border-left: 4px solid var(--color-ai);
        border-radius: 0 var(--radius-md) var(--radius-md) 0;
        padding: var(--s-4);
        display: flex;
        flex-direction: column;
        gap: var(--s-3);
      }

      .ai-head {
        display: flex;
        align-items: center;
        gap: var(--s-2);
        flex-wrap: wrap;
      }

      .ai-mark {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border-radius: var(--radius-pill);
        background: var(--color-ai);
        color: #FFFFFF;
        font-size: 13px;
      }

      .ai-label {
        font-size: 13px;
        font-weight: 600;
        color: var(--color-ai);
        letter-spacing: 0.02em;
      }

      .ai-draft-tag {
        background: var(--color-ai) !important;
        color: #FFFFFF !important;
        border: none !important;
        font-weight: 600;
        letter-spacing: 0.06em;
      }

      .ai-feature {
        margin-left: auto;
        font-size: 11px;
        color: var(--color-ai);
        opacity: 0.72;
      }

      .ai-body {
        font-size: var(--text-body);
        color: var(--color-text-primary);
        line-height: var(--leading-normal);
      }

      .ai-foot {
        display: inline-flex;
        align-items: center;
        gap: var(--s-2);
        font-size: var(--text-small);
        color: var(--color-ai);
        background: var(--color-surface-2);
        padding: var(--s-2) var(--s-3);
        border-radius: var(--radius-sm);
        border: 1px dashed var(--color-ai);
      }

      :root[data-theme='dark'] .ai-foot { background: rgba(0, 0, 0, 0.25); }
    `,
  ],
})
export class AiContentComponent {
  /** Set to `true` once the AI output has been ACCEPTED or EDITED by a reviewer. */
  @Input() reviewed = false;

  /** Optional AI feature tag (AI-01..AI-07). Surfaced top-right. */
  @Input() feature: string | null = null;
}
