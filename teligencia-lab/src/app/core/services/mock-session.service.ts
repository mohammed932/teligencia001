/*
 * MockSessionService — current user + role as signals.
 * Drives the role switcher which in turn drives "Needs your attention"
 * + SLA-watch visibility on the dashboard.
 */

import { Injectable, computed, signal } from '@angular/core';
import { Person } from '../models/domain';
import { Role } from '../models/enums';
import { STAFF, STAFF_BY_ID } from '../mock-data/people';

@Injectable({ providedIn: 'root' })
export class MockSessionService {
  /** All staff available to switch into. */
  readonly directory = STAFF;

  /** Default: Lea Hoffmann (PM) — best showcase for role-aware sections. */
  private readonly _currentUserId = signal<string>('u2');

  readonly currentUser = computed<Person>(() => STAFF_BY_ID[this._currentUserId()]);
  readonly currentRole = computed<Role>(() => this.currentUser().role);

  /** Show SLA strip for these roles only. */
  readonly canSeeSla = computed<boolean>(() =>
    this.currentRole() === 'pm' || this.currentRole() === 'lab_admin'
  );

  switchUser(userId: string): void {
    if (!STAFF_BY_ID[userId]) { return; }
    this._currentUserId.set(userId);
  }
}
