/*
 * PortalPickerPage — root route.
 * Polished split-screen: Lab Portal (navy) vs Customer Portal (light).
 * Two large entry cards with status meta, brand band, no marketing fluff.
 */

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { ThemeToggleComponent } from '../shared/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-portal-picker-page',
  standalone: true,
  imports: [RouterLink, NzIconModule, ThemeToggleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="picker">
      <header class="brand">
        <picture class="brand-mark">
          <img src="assets/brand/wordmark-navy.svg" alt="Teligencia" width="148" height="22" class="mark-light"/>
          <img src="assets/brand/wordmark.svg"      alt=""         width="148" height="22" class="mark-dark"/>
        </picture>
        <div class="brand-right">
          <span class="t-caption tag">ISO/IEC 17025 · staging · eu-central-1</span>
          <app-theme-toggle></app-theme-toggle>
        </div>
      </header>

      <section class="hero">
        <div class="hero-text">
          <p class="t-caption eyebrow">Teligencia · dual-portal entry</p>
          <h1 class="t-display">Two surfaces. One audit trail.</h1>
          <p class="t-body lede">
            Lab Portal drives the testing pipeline end-to-end. Customer Portal exposes
            staged, signed deliverables to manufacturers. Pick the surface you need.
          </p>
        </div>
      </section>

      <section class="cards">
        <a class="card lab" routerLink="/lab/dashboard">
          <div class="card-band" aria-hidden="true"></div>
          <div class="card-head">
            <span class="card-tag">Lab Portal</span>
            <i nz-icon nzType="arrow-right" class="card-arrow"></i>
          </div>
          <h2 class="t-h1 card-title">Operate the lab</h2>
          <p class="t-body card-body">
            Manage intake, contract reviews, test execution, findings, evidence,
            and the ISO 17025 gate enforcement that signs every report.
          </p>
          <ul class="card-meta">
            <li><i nz-icon nzType="check-circle" aria-hidden="true"></i> Six roles · Clerk MFA mandatory</li>
            <li><i nz-icon nzType="check-circle" aria-hidden="true"></i> Eight compliance gates enforced</li>
            <li><i nz-icon nzType="check-circle" aria-hidden="true"></i> Immutable audit log (G-06)</li>
          </ul>
        </a>

        <a class="card customer" [href]="customerUrl" target="_blank" rel="noopener">
          <div class="card-band cyan" aria-hidden="true"></div>
          <div class="card-head">
            <span class="card-tag customer-tag">Customer Portal</span>
            <i nz-icon nzType="arrow-right" class="card-arrow"></i>
          </div>
          <h2 class="t-h1 card-title">Track your evaluation</h2>
          <p class="t-body card-body">
            Customer view: friendly status, intake form, customer-visible findings,
            issued reports, and a Q&A channel with your project manager.
          </p>
          <ul class="card-meta">
            <li><i nz-icon nzType="check-circle" aria-hidden="true"></i> Staged visibility · only approved data</li>
            <li><i nz-icon nzType="check-circle" aria-hidden="true"></i> Signed reports · SHA-256 verified</li>
            <li><i nz-icon nzType="check-circle" aria-hidden="true"></i> GDPR Frankfurt residency</li>
          </ul>
          <p class="card-ext t-small">Separate workspace · opens {{ customerUrl }}</p>
        </a>
      </section>

      <footer class="foot">
        <span class="t-small">© 2026 Teligencia Labs · Teligencia demo · all data simulated</span>
      </footer>
    </main>
  `,
  styleUrl: './portal-picker.page.scss'
})
export class PortalPickerPage {
  /** Customer Portal runs in its own workspace on port 4300. */
  readonly customerUrl = 'http://localhost:4300/';
}
