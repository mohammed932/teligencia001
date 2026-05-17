/*
 * PortalPickerPage — root route.
 * Pro Max treatment: editorial dual-card picker for ISO/IEC 17025 lab platform.
 * Refined Technical Modernism: Fraunces serif display, JetBrains Mono IDs,
 * cyan signal lines, navy gravitas. No gradients, no glassmorphism.
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
      <!-- BRAND BAR -->
      <header class="brand">
        <picture class="brand-mark">
          <img src="assets/brand/wordmark-navy.svg" alt="Teligencia" width="148" height="22" class="mark-light"/>
          <img src="assets/brand/wordmark.svg"      alt=""         width="148" height="22" class="mark-dark"/>
        </picture>
        <div class="brand-right">
          <span class="t-mono brand-meta">v0.1.0 · build {{ buildId }}</span>
          <app-theme-toggle></app-theme-toggle>
        </div>
      </header>

      <!-- TRUST STRIP -->
      <aside class="trust-strip" aria-label="Operational context">
        <span class="trust-cell">
          <span class="trust-dot trust-dot--live" aria-hidden="true"></span>
          <span class="t-mono trust-label">STAGING</span>
        </span>
        <span class="trust-cell"><span class="t-caption trust-key">Accreditation</span><span class="t-mono trust-val">ISO/IEC 17025</span></span>
        <span class="trust-cell"><span class="t-caption trust-key">Region</span><span class="t-mono trust-val">eu-central-1 · Frankfurt</span></span>
        <span class="trust-cell"><span class="t-caption trust-key">Residency</span><span class="t-mono trust-val">GDPR · in-jurisdiction</span></span>
        <span class="trust-cell"><span class="t-caption trust-key">Signing</span><span class="t-mono trust-val">SHA-256 · G-08</span></span>
      </aside>

      <!-- EDITORIAL HERO -->
      <section class="hero">
        <p class="t-caption eyebrow">Dual-Portal Entry · Vol. I</p>
        <h1 class="t-display headline">
          Two surfaces. <em>One</em> audit&nbsp;trail.
        </h1>
        <p class="t-body lede">
          Lab Portal runs the testing pipeline end-to-end &mdash; intake, contract,
          execution, evidence, sign-off. Customer Portal exposes only what's
          staged and signed. Same ledger. Different rooms.
        </p>
      </section>

      <!-- DUAL CARDS -->
      <section class="cards">
        <!-- 01 — LAB -->
        <a class="card lab" routerLink="/lab/dashboard">
          <div class="card-band" aria-hidden="true"></div>
          <div class="card-rule" aria-hidden="true"></div>

          <div class="card-head">
            <span class="chapter t-serif">01</span>
            <span class="card-id t-mono">TLG&middot;LAB&middot;01</span>
          </div>

          <div class="card-body">
            <p class="t-caption card-tag">Lab Portal · Operator surface</p>
            <h2 class="t-serif card-title">Operate the lab.</h2>
            <p class="t-body card-lede">
              Intake, contract review, test execution, findings, evidence,
              and the ISO&nbsp;17025 gate enforcement that signs every report.
            </p>
          </div>

          <dl class="metrics">
            <div class="metric">
              <dt class="t-caption">Roles</dt>
              <dd class="t-mono metric-val">06</dd>
            </div>
            <div class="metric">
              <dt class="t-caption">Gates</dt>
              <dd class="t-mono metric-val">08</dd>
            </div>
            <div class="metric">
              <dt class="t-caption">MFA</dt>
              <dd class="t-mono metric-val">CLERK&nbsp;✓</dd>
            </div>
            <div class="metric">
              <dt class="t-caption">Audit log</dt>
              <dd class="t-mono metric-val">G-06</dd>
            </div>
          </dl>

          <footer class="card-foot">
            <span class="card-cta">
              <span class="t-mono cta-label">Enter Lab</span>
              <i nz-icon nzType="arrow-right" class="cta-arrow"></i>
            </span>
            <span class="t-mono card-route">/lab/dashboard</span>
          </footer>
        </a>

        <!-- 02 — CUSTOMER -->
        <a class="card customer" [href]="customerUrl" target="_blank" rel="noopener">
          <div class="card-band cyan" aria-hidden="true"></div>
          <div class="card-rule" aria-hidden="true"></div>

          <div class="card-head">
            <span class="chapter t-serif">02</span>
            <span class="card-id t-mono">TLG&middot;CUS&middot;02</span>
          </div>

          <div class="card-body">
            <p class="t-caption card-tag customer-tag">Customer Portal · Manufacturer view</p>
            <h2 class="t-serif card-title">Track your evaluation.</h2>
            <p class="t-body card-lede">
              Friendly status, intake form, customer-visible findings, signed
              reports, and a Q&amp;A channel with your project manager.
            </p>
          </div>

          <dl class="metrics">
            <div class="metric">
              <dt class="t-caption">Visibility</dt>
              <dd class="t-mono metric-val">STAGED</dd>
            </div>
            <div class="metric">
              <dt class="t-caption">Reports</dt>
              <dd class="t-mono metric-val">SHA-256</dd>
            </div>
            <div class="metric">
              <dt class="t-caption">Residency</dt>
              <dd class="t-mono metric-val">FRA · EU</dd>
            </div>
            <div class="metric">
              <dt class="t-caption">Channel</dt>
              <dd class="t-mono metric-val">Q&amp;A · PM</dd>
            </div>
          </dl>

          <footer class="card-foot">
            <span class="card-cta">
              <span class="t-mono cta-label">Open Customer</span>
              <i nz-icon nzType="arrow-right" class="cta-arrow"></i>
            </span>
            <span class="t-mono card-route">{{ customerUrl }}</span>
          </footer>
        </a>
      </section>

      <!-- PROOF BAR -->
      <section class="proof" aria-label="Platform guarantees">
        <div class="proof-row">
          <span class="proof-item">
            <i nz-icon nzType="safety-certificate" class="proof-ico" aria-hidden="true"></i>
            <span class="t-small">Every report countersigned · clerk &amp; reviewer · before issue</span>
          </span>
          <span class="proof-item">
            <i nz-icon nzType="lock" class="proof-ico" aria-hidden="true"></i>
            <span class="t-small">Append-only audit ledger · cryptographically chained</span>
          </span>
          <span class="proof-item">
            <i nz-icon nzType="check-circle" class="proof-ico" aria-hidden="true"></i>
            <span class="t-small">Eight enforcement gates · zero shortcut paths</span>
          </span>
        </div>
      </section>

      <!-- FOOTER -->
      <footer class="foot">
        <span class="t-small">&copy; 2026 Teligencia Labs &middot; demo workspace &middot; all data simulated</span>
        <span class="t-mono foot-build">commit {{ buildId }}</span>
      </footer>
    </main>
  `,
  styleUrl: './portal-picker.page.scss'
})
export class PortalPickerPage {
  /** Customer Portal runs in its own workspace on port 4300. */
  readonly customerUrl = 'http://localhost:4300/';
  /** Build identifier — pinned literal for the demo. */
  readonly buildId = '6986955';
}
