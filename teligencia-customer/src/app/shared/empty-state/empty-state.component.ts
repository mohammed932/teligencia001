/*
 * EmptyState — wraps an inline SVG illustration + headline + body.
 * Props: title (required), body (required), illustration (required token name).
 * SVG fills/strokes carry no hex literals — colors come from tokens via SCSS classes.
 */

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

type Illustration = 'scope' | 'shield-clear' | 'inbox-quiet' | 'spool' | 'target';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty">
      <div class="art" [attr.data-illu]="illustration" aria-hidden="true">
        @switch (illustration) {
          @case ('scope') {
            <svg viewBox="0 0 120 120" width="120" height="120" class="illu illu-scope">
              <circle cx="60" cy="60" r="46" class="stroke-navy stroke-018"/>
              <circle cx="60" cy="60" r="32" class="stroke-navy stroke-030"/>
              <circle cx="60" cy="60" r="6"  class="fill-cyan"/>
              <line x1="14" y1="60" x2="106" y2="60" class="stroke-navy stroke-025"/>
              <line x1="60" y1="14" x2="60"  y2="106" class="stroke-navy stroke-025"/>
            </svg>
          }
          @case ('shield-clear') {
            <svg viewBox="0 0 120 120" width="120" height="120" class="illu illu-shield">
              <path d="M60 14 L96 26 V62 C96 82 80 96 60 106 C40 96 24 82 24 62 V26 Z" class="fill-cyanbg stroke-navy"/>
              <path d="M44 60 L56 72 L82 46" class="path-check"/>
            </svg>
          }
          @case ('inbox-quiet') {
            <svg viewBox="0 0 120 120" width="120" height="120" class="illu illu-inbox">
              <rect x="14" y="34" width="92" height="62" rx="8" class="fill-surface stroke-navy"/>
              <path d="M14 64 H42 L48 76 H72 L78 64 H106" class="stroke-navy" fill="none"/>
              <line x1="36" y1="46" x2="84" y2="46" class="stroke-navy stroke-025"/>
              <line x1="44" y1="54" x2="76" y2="54" class="stroke-navy stroke-018"/>
              <circle cx="60" cy="22" r="3" class="fill-cyan"/>
            </svg>
          }
          @case ('spool') {
            <svg viewBox="0 0 120 120" width="120" height="120" class="illu illu-spool">
              <path d="M24 80 C24 50 60 50 60 80 C60 110 96 110 96 80" class="stroke-navy" fill="none"/>
              <circle cx="24" cy="80" r="4" class="fill-navy"/>
              <circle cx="60" cy="80" r="4" class="fill-navy"/>
              <circle cx="96" cy="80" r="4" class="fill-cyan"/>
              <rect x="20" y="20" width="80" height="22" rx="6" class="fill-cyanbg stroke-navy"/>
              <line x1="30" y1="31" x2="78" y2="31" class="stroke-navy"/>
              <circle cx="86" cy="31" r="3" class="fill-cyan"/>
            </svg>
          }
          @case ('target') {
            <svg viewBox="0 0 120 120" width="120" height="120" class="illu illu-target">
              <circle cx="60" cy="60" r="44" class="stroke-navy" fill="none"/>
              <circle cx="60" cy="60" r="30" class="stroke-navy" fill="none"/>
              <circle cx="60" cy="60" r="16" class="stroke-navy" fill="none"/>
              <circle cx="60" cy="60" r="5"  class="fill-cyan"/>
            </svg>
          }
        }
      </div>
      <div class="text">
        <h3 class="t-h2 title">{{ title }}</h3>
        <p class="t-body body">{{ body }}</p>
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styleUrl: './empty-state.component.scss'
})
export class EmptyStateComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) body!: string;
  @Input({ required: true }) illustration!: Illustration;
}
