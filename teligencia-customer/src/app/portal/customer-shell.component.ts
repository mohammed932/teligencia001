/*
 * CustomerShell — Customer Portal chrome.
 * Top navigation (no sidebar — generous whitespace per constitution).
 * Wordmark left, primary nav center, theme toggle + avatar right.
 */

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { ThemeToggleComponent } from '../shared/theme-toggle/theme-toggle.component';
import { AvatarComponent } from '../shared/avatar/avatar.component';
import { CURRENT_CUSTOMER } from '../core/mock-data/customer-data';

@Component({
  selector: 'app-customer-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NzIconModule, ThemeToggleComponent, AvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="topbar">
      <div class="topbar-inner">
        <a class="brand" routerLink="/portal/projects" aria-label="Teligencia — projects">
          <picture class="brand-mark">
            <img src="assets/brand/wordmark-navy.svg" alt="Teligencia" width="148" height="22" class="mark-light"/>
            <img src="assets/brand/wordmark.svg"      alt=""         width="148" height="22" class="mark-dark"/>
          </picture>
          <span class="brand-tag t-caption">Customer Portal</span>
        </a>

        <nav class="primary" aria-label="Primary">
          <a class="nav-link" routerLink="/portal/projects" routerLinkActive="active">Projects</a>
          <a class="nav-link" routerLink="/portal/intake"   routerLinkActive="active">Intake</a>
          <a class="nav-link" routerLink="/portal/findings" routerLinkActive="active">Findings</a>
          <a class="nav-link" routerLink="/portal/reports"  routerLinkActive="active">Reports</a>
          <a class="nav-link" routerLink="/portal/messages" routerLinkActive="active">Messages</a>
        </nav>

        <div class="actions">
          <app-theme-toggle></app-theme-toggle>
          <a class="ext" href="http://localhost:4200/" target="_blank" rel="noopener" aria-label="Open Lab Portal">
            <i nz-icon nzType="swap" aria-hidden="true"></i>
            <span>Lab Portal ↗</span>
          </a>
          <span class="sep" aria-hidden="true"></span>
          <span class="user">
            <app-avatar [name]="customer.contactName" size="md"></app-avatar>
            <span class="user-id">
              <span class="user-name">{{ customer.contactName }}</span>
              <span class="user-meta t-small">{{ customer.orgName }}</span>
            </span>
          </span>
        </div>
      </div>
    </header>

    <main class="content" tabindex="-1">
      <div class="content-inner">
        <router-outlet></router-outlet>
      </div>
    </main>

    <footer class="foot">
      <p class="t-small">© 2026 Teligencia Labs · GDPR · data hosted in Frankfurt (eu-central-1)</p>
    </footer>
  `,
  styleUrl: './customer-shell.component.scss'
})
export class CustomerShellComponent {
  protected readonly customer = CURRENT_CUSTOMER;
}
