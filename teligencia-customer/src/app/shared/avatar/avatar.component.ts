/*
 * Avatar — initials avatar with deterministic tint from name.
 * Props: name (required), size ('sm'|'md'|'lg' — default 'sm').
 */

import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';

@Component({
  selector: 'app-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="avatar" [class.sm]="size === 'sm'" [class.md]="size === 'md'" [class.lg]="size === 'lg'"
          [style.--avatar-bg]="tint()" aria-hidden="true">
      {{ initials() }}
    </span>
  `,
  styleUrl: './avatar.component.scss'
})
export class AvatarComponent {
  private readonly _name = signal<string>('');
  @Input({ required: true }) set name(v: string) { this._name.set(v); }
  @Input() size: 'sm' | 'md' | 'lg' = 'sm';

  readonly initials = computed(() => {
    const parts = this._name().trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) { return '·'; }
    if (parts.length === 1) { return parts[0].slice(0, 2).toUpperCase(); }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  });

  readonly tint = computed(() => {
    const palette = [
      'rgba(10, 37, 64, 0.92)',
      'rgba(107, 91, 210, 0.92)',
      'rgba(0, 144, 173, 0.92)',
      'rgba(22, 163, 74, 0.85)',
      'rgba(217, 119, 6, 0.85)',
      'rgba(91, 101, 115, 0.92)'
    ];
    let h = 0;
    for (const c of this._name()) { h = (h * 31 + c.charCodeAt(0)) | 0; }
    return palette[Math.abs(h) % palette.length];
  });
}
