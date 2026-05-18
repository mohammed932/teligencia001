/*
 * AuthService — Lab Portal Clerk wrapper.
 *
 * Responsibilities:
 *   - Load and boot Clerk JS (idempotent).
 *   - Expose isReady + isSignedIn signals.
 *   - Provide token() for the auth interceptor.
 *   - Provide signIn() (redirect to Clerk-hosted page) and signOut().
 *
 * Constitution Rule 3: MFA is enforced inside Clerk; we trust Clerk's
 * "session active only after MFA" guarantee.
 */

import { Injectable, signal } from '@angular/core';
import { Clerk } from '@clerk/clerk-js';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  /** Clerk JS instance; lazily initialised on first call to load(). */
  private clerk: Clerk | null = null;
  private loadPromise: Promise<void> | null = null;

  readonly isReady = signal(false);
  readonly isSignedIn = signal(false);

  /**
   * Idempotent. Called once at bootstrap (APP_INITIALIZER) and safe to call
   * again from guards if the user navigates before bootstrap finishes.
   */
  load(): Promise<void> {
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      this.clerk = new Clerk(environment.clerkPublishableKey);
      await this.clerk.load();
      this.clerk.addListener(({ user }) => {
        this.isSignedIn.set(!!user);
      });
      this.isSignedIn.set(!!this.clerk.user);
      this.isReady.set(true);
    })();
    return this.loadPromise;
  }

  /** Returns the current Clerk session token, refreshing internally as needed. */
  async token(): Promise<string | null> {
    await this.load();
    const session = this.clerk?.session;
    if (!session) return null;
    return session.getToken();
  }

  /** Redirect the browser to Clerk's hosted sign-in page. */
  signIn(returnUrl: string = '/lab/dashboard'): void {
    if (!this.clerk) {
      throw new Error('AuthService.signIn() called before load() resolved');
    }
    this.clerk.redirectToSignIn({
      // Clerk preserves return-url across the MFA prompt.
      afterSignInUrl: returnUrl,
    });
  }

  async signOut(): Promise<void> {
    await this.load();
    await this.clerk?.signOut();
    this.isSignedIn.set(false);
  }
}
