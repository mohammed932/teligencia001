/*
 * ThemeToggle — segmented control: light · system · dark.
 * Props: compact (optional, defaults true — icon-only).
 * Drives ThemeService.preference. Uses inline SVGs (no ant-design
 * dependency for sun/moon — ant-design does not ship a moon icon).
 */

import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { ThemeService, ThemePref } from '../../core/services/theme.service';

interface Option { readonly value: ThemePref; readonly label: string; }

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [NzToolTipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <fieldset class="seg" [class.compact]="compact" aria-label="Theme">
      <legend class="sr-only">Theme</legend>
      @for (opt of options; track opt.value) {
        <button type="button"
                class="seg-btn"
                [class.active]="theme.preference() === opt.value"
                [attr.aria-pressed]="theme.preference() === opt.value"
                [nz-tooltip]="opt.label + ' theme'"
                nzTooltipPlacement="bottom"
                (click)="theme.set(opt.value)">
          @switch (opt.value) {
            @case ('light') {
              <svg class="ico" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/>
                <g stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <line x1="12" y1="2"  x2="12" y2="4"/>
                  <line x1="12" y1="20" x2="12" y2="22"/>
                  <line x1="2"  y1="12" x2="4"  y2="12"/>
                  <line x1="20" y1="12" x2="22" y2="12"/>
                  <line x1="4.6" y1="4.6"  x2="6"  y2="6"/>
                  <line x1="18"  y1="18"  x2="19.4" y2="19.4"/>
                  <line x1="4.6" y1="19.4" x2="6"  y2="18"/>
                  <line x1="18"  y1="6"   x2="19.4" y2="4.6"/>
                </g>
              </svg>
            }
            @case ('system') {
              <svg class="ico" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                <rect x="3" y="4" width="18" height="13" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/>
                <line x1="8" y1="20" x2="16" y2="20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <line x1="12" y1="17" x2="12" y2="20" stroke="currentColor" stroke-width="2"/>
              </svg>
            }
            @case ('dark') {
              <svg class="ico" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                <path d="M20 14.5 A8 8 0 1 1 9.5 4 A6 6 0 0 0 20 14.5 Z"
                      fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
              </svg>
            }
          }
          @if (!compact) { <span class="seg-label">{{ opt.label }}</span> }
          <span class="sr-only">{{ opt.label }} theme</span>
        </button>
      }
    </fieldset>
  `,
  styleUrl: './theme-toggle.component.scss'
})
export class ThemeToggleComponent {
  protected readonly theme = inject(ThemeService);
  @Input() compact = true;

  readonly options: Option[] = [
    { value: 'light',  label: 'Light' },
    { value: 'system', label: 'System' },
    { value: 'dark',   label: 'Dark' }
  ];
}
