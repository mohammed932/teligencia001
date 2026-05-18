/*
 * CurrentUserStore — calls GET /auth/me once after sign-in and caches the
 * resolved identity. Components subscribe via the currentUser signal.
 *
 * The DTO mirrors contracts/auth-me.openapi.yaml.
 */

import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StaffRole } from './staff-role';

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string | null;
  role: StaffRole;
  orgId: string;
}

@Injectable({ providedIn: 'root' })
export class CurrentUserStore {
  private readonly http = inject(HttpClient);

  readonly currentUser = signal<CurrentUser | null>(null);
  private loadPromise: Promise<CurrentUser | null> | null = null;

  /** Idempotent fetch. Returns the resolved user or null on 401/403. */
  ensureLoaded(): Promise<CurrentUser | null> {
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      try {
        const u = await firstValueFrom(
          this.http.get<CurrentUser>(`${environment.apiBaseUrl}/auth/me`),
        );
        this.currentUser.set(u);
        return u;
      } catch {
        this.currentUser.set(null);
        return null;
      }
    })();
    return this.loadPromise;
  }

  /** Reset on sign-out so the next sign-in re-fetches /auth/me. */
  clear(): void {
    this.currentUser.set(null);
    this.loadPromise = null;
  }
}
