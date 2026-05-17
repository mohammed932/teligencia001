/*
 * ThemeService — light/dark/system theme state.
 * - Signal-driven (`preference`, `effective`).
 * - Persists user pick to localStorage under "teligencia.theme".
 * - Listens to prefers-color-scheme when preference is 'system'.
 * - Writes `data-theme="light|dark"` on <html> on every change.
 *
 * The matching inline boot script in index.html applies the saved
 * preference before the bundle runs so there is no FOUC.
 */

import { Injectable, computed, effect, signal } from '@angular/core';

export type ThemePref = 'light' | 'dark' | 'system';
export type ThemeEffective = 'light' | 'dark';

const STORAGE_KEY = 'teligencia.theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly mq: MediaQueryList | null =
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : null;

  private readonly _preference = signal<ThemePref>(this.readStoredPreference());
  private readonly _systemDark = signal<boolean>(this.mq?.matches ?? false);

  readonly preference = this._preference.asReadonly();
  readonly effective = computed<ThemeEffective>(() => {
    const pref = this._preference();
    if (pref === 'system') { return this._systemDark() ? 'dark' : 'light'; }
    return pref;
  });

  constructor() {
    this.mq?.addEventListener('change', e => this._systemDark.set(e.matches));

    effect(() => {
      const t = this.effective();
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', t);
      }
    });

    effect(() => {
      const pref = this._preference();
      try { localStorage.setItem(STORAGE_KEY, pref); } catch { /* private mode etc */ }
    });
  }

  set(pref: ThemePref): void { this._preference.set(pref); }

  toggle(): void {
    const current = this.effective();
    this.set(current === 'dark' ? 'light' : 'dark');
  }

  private readStoredPreference(): ThemePref {
    if (typeof localStorage === 'undefined') { return 'system'; }
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === 'light' || raw === 'dark' || raw === 'system' ? raw : 'system';
  }
}
