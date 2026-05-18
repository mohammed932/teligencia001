/*
 * Access Denied — shown when a signed-in user lacks the role required by
 * a route. No business data; no role names; just an explanatory message
 * with a link back to the dashboard.
 */

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="ad">
      <p class="t-caption ad-eyebrow">Restricted</p>
      <h1 class="t-display">You don't have access to this area.</h1>
      <p class="t-body ad-lede">
        Your role does not permit this view. If you need access, contact your
        lab administrator.
      </p>
      <a class="ad-link" routerLink="/lab/dashboard">← Back to dashboard</a>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background: var(--bg-app);
        color: var(--text);
      }
      .ad {
        max-width: 720px;
        margin: 0 auto;
        padding: 96px 32px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .ad-eyebrow {
        color: var(--text-muted);
        letter-spacing: 0.1em;
      }
      .ad-lede {
        color: var(--text-muted);
        max-width: 56ch;
      }
      .ad-link {
        margin-top: 24px;
        color: var(--brand-cyan);
        font-weight: 500;
      }
    `,
  ],
})
export class AccessDeniedComponent {}
