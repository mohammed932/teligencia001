/*
 * LabShell — outer chrome for the Lab Portal.
 * - 240px sidebar (navy)
 * - 64px topbar (white)
 * - Content area centered, max 1440px, 32px horizontal padding
 * Routed children render in <router-outlet/>.
 */

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { firstValueFrom } from 'rxjs';
import { RoleSwitcherComponent } from '../../shared/role-switcher/role-switcher.component';
import { ThemeToggleComponent } from '../../shared/theme-toggle/theme-toggle.component';
import { MockSessionService } from '../../core/services/mock-session.service';
import { AuthService } from '../../core/auth/auth.service';
import { CurrentUserStore } from '../../core/auth/current-user.store';
import { environment } from '../../../environments/environment';

interface NavItem { readonly path: string; readonly label: string; readonly icon: string; }

@Component({
  selector: 'app-lab-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NzIconModule, RoleSwitcherComponent, ThemeToggleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shell">
      <aside class="sidebar" aria-label="Lab navigation">
        <a class="brand" routerLink="/lab/dashboard" aria-label="Teligencia dashboard">
          <img src="assets/brand/wordmark.svg" alt="Teligencia" width="148" height="22" />
        </a>

        <nav class="nav-section">
          <p class="t-caption nav-heading">Workspace</p>
          <ul class="nav-list">
            @for (item of primaryNav; track item.path) {
              <li>
                <a class="nav-link" [routerLink]="item.path" routerLinkActive="active">
                  <i nz-icon [nzType]="item.icon" class="nav-icon" aria-hidden="true"></i>
                  <span>{{ item.label }}</span>
                </a>
              </li>
            }
          </ul>
        </nav>

        <nav class="nav-section">
          <p class="t-caption nav-heading">Operations</p>
          <ul class="nav-list">
            @for (item of secondaryNav; track item.path) {
              <li>
                <a class="nav-link" [routerLink]="item.path" routerLinkActive="active">
                  <i nz-icon [nzType]="item.icon" class="nav-icon" aria-hidden="true"></i>
                  <span>{{ item.label }}</span>
                </a>
              </li>
            }
          </ul>
        </nav>

        <div class="sidebar-foot">
          <a class="portal-link" href="http://localhost:4300/" target="_blank" rel="noopener" aria-label="Open Customer Portal in new tab">
            <i nz-icon nzType="swap" class="nav-icon" aria-hidden="true"></i>
            <span>Customer Portal ↗</span>
          </a>
          <a class="portal-link" routerLink="/" aria-label="Portal picker">
            <i nz-icon nzType="home" class="nav-icon" aria-hidden="true"></i>
            <span>Portal picker</span>
          </a>
          <button class="portal-link sign-out-btn" type="button" (click)="signOut()" aria-label="Sign out">
            <i nz-icon nzType="logout" class="nav-icon" aria-hidden="true"></i>
            <span>Sign out</span>
          </button>
          <p class="env">Demo · staging · eu-central-1</p>
        </div>
      </aside>

      <div class="main">
        <header class="topbar">
          <div class="search">
            <i nz-icon nzType="search" class="search-icon" aria-hidden="true"></i>
            <input type="search"
                   placeholder="Search projects, findings, evidence…"
                   aria-label="Global search" />
            <kbd class="kbd" aria-hidden="true">⌘K</kbd>
          </div>

          <div class="topbar-actions">
            <app-theme-toggle></app-theme-toggle>
            <button class="icon-btn" type="button" aria-label="Notifications">
              <i nz-icon nzType="bell" aria-hidden="true"></i>
              <span class="badge-dot" aria-hidden="true"></span>
            </button>
            <button class="icon-btn" type="button" aria-label="Help">
              <i nz-icon nzType="message" aria-hidden="true"></i>
            </button>
            <span class="topbar-sep" aria-hidden="true"></span>
            <app-role-switcher></app-role-switcher>
          </div>
        </header>

        <main class="content" tabindex="-1">
          <div class="content-inner">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>
    </div>
  `,
  styleUrl: './lab-shell.component.scss'
})
export class LabShellComponent {
  protected readonly session = inject(MockSessionService);
  protected readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly currentUser = inject(CurrentUserStore);
  private readonly http = inject(HttpClient);

  async signOut(): Promise<void> {
    /*
     * Audit hook before Clerk revokes the session — once the token is
     * gone the backend can't write SESSION_ENDED.
     */
    try {
      await firstValueFrom(
        this.http.post(`${environment.apiBaseUrl}/auth/sign-out`, {}),
      );
    } catch {
      // Audit failure must not block the sign-out itself.
    }
    this.currentUser.clear();
    await this.auth.signOut();
    await this.router.navigateByUrl('/');
  }

  readonly primaryNav: NavItem[] = [
    { path: '/lab/dashboard',          label: 'Dashboard',         icon: 'dashboard' },
    { path: '/lab/coming-soon/projects', label: 'Projects',         icon: 'folder-open' },
    { path: '/lab/coming-soon/findings', label: 'Findings',          icon: 'alert' },
    { path: '/lab/coming-soon/test-execution', label: 'Test execution', icon: 'experiment' },
    { path: '/lab/coming-soon/evidence',  label: 'Evidence',          icon: 'paper-clip' },
    { path: '/lab/coming-soon/reports',   label: 'Reports',           icon: 'file-protect' }
  ];

  readonly secondaryNav: NavItem[] = [
    { path: '/lab/coming-soon/sla',        label: 'SLA & MA-DD',     icon: 'clock-circle' },
    { path: '/lab/coming-soon/standards',  label: 'Standards library', icon: 'safety-certificate' },
    { path: '/lab/coming-soon/audit',      label: 'Audit trail',     icon: 'audit' },
    { path: '/lab/coming-soon/users',      label: 'Users & roles',   icon: 'team' },
    { path: '/lab/coming-soon/settings',   label: 'Settings',        icon: 'setting' }
  ];
}
