/*
 * ProjectsPage — customer dashboard. Lists the customer's projects with
 * friendly status text, next-action lines, and a "Download report" CTA
 * for any ISSUED project.
 */

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { CURRENT_CUSTOMER, CUSTOMER_PROJECTS, CUSTOMER_FINDINGS } from '../core/mock-data/customer-data';
import { StatusBadgeComponent } from '../shared/status-badge/status-badge.component';
import { AvatarComponent } from '../shared/avatar/avatar.component';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';

@Component({
  selector: 'app-projects-page',
  standalone: true,
  imports: [DatePipe, RouterLink, NzIconModule, StatusBadgeComponent, AvatarComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="greet">
      <p class="t-caption eyebrow">{{ customer.orgName }} · Customer Portal</p>
      <h1 class="t-display">Welcome back, {{ firstName() }}.</h1>
      <p class="t-body lede">
        {{ projects().length }} active evaluations · {{ totalUnread() }} unread updates ·
        {{ readyReports() }} signed report{{ readyReports() === 1 ? '' : 's' }} available.
      </p>
    </section>

    <section class="grid">
      @for (p of projects(); track p.id) {
        <article class="card" [class.featured]="p.hasIssuedReport">
          <header class="card-head">
            <span class="t-caption code num">{{ p.code }}</span>
            <app-status-badge [status]="p.status" variant="customer"></app-status-badge>
          </header>

          <h2 class="t-h2 title">{{ p.title }}</h2>
          <p class="t-body product">{{ p.productName }}</p>

          <div class="meta">
            <div class="meta-line">
              <span class="t-caption">Project manager</span>
              <span class="meta-val">
                <app-avatar [name]="p.pmName" size="sm"></app-avatar>
                <span>{{ p.pmName }}</span>
              </span>
            </div>
            <div class="meta-line">
              <span class="t-caption">Started</span>
              <span class="meta-val num">{{ p.startedAt | date: 'd MMM y' }}</span>
            </div>
            @if (p.slaDueAt) {
              <div class="meta-line">
                <span class="t-caption">Next checkpoint</span>
                <span class="meta-val num">{{ p.slaDueAt | date: 'd MMM, HH:mm' }}</span>
              </div>
            }
          </div>

          <div class="progress">
            <div class="bar" [attr.aria-label]="'Progress ' + p.progressPct + '%'">
              <span class="bar-fill" [style.width.%]="p.progressPct"></span>
            </div>
            <span class="t-small num">{{ p.progressPct }}%</span>
          </div>

          @if (p.nextActionForCustomer) {
            <p class="next">
              <i nz-icon nzType="arrow-right" class="next-ico" aria-hidden="true"></i>
              {{ p.nextActionForCustomer }}
            </p>
          }

          <footer class="card-foot">
            @if (p.hasIssuedReport) {
              <a class="cta primary" [routerLink]="['/portal/reports']">
                <i nz-icon nzType="file-protect" aria-hidden="true"></i>
                Download signed report
              </a>
            } @else {
              <a class="cta ghost" [routerLink]="['/portal/messages']" [queryParams]="{ project: p.code }">
                <i nz-icon nzType="message" aria-hidden="true"></i>
                Message {{ p.pmName.split(' ')[0] }}
              </a>
            }
            <a class="cta link" [routerLink]="['/portal/findings']" [queryParams]="{ project: p.code }">
              {{ findingsCount(p.id) }} customer-visible finding{{ findingsCount(p.id) === 1 ? '' : 's' }} →
            </a>
          </footer>
        </article>
      } @empty {
        <app-empty-state
          title="No active evaluations yet"
          body="Your project manager will activate evaluations here. Once intake starts, this page tracks every step."
          illustration="spool">
        </app-empty-state>
      }
    </section>
  `,
  styleUrl: './projects.page.scss'
})
export class ProjectsPage {
  protected readonly customer = CURRENT_CUSTOMER;
  protected readonly projects = signal(CUSTOMER_PROJECTS);

  protected readonly firstName = computed(() => this.customer.contactName.split(' ')[0]);
  protected readonly totalUnread = computed(() => 2);
  protected readonly readyReports = computed(() => CUSTOMER_PROJECTS.filter(p => p.hasIssuedReport).length);

  protected findingsCount(projectId: string): number {
    return CUSTOMER_FINDINGS.filter(f => f.projectId === projectId).length;
  }
}
