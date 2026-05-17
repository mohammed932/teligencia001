/*
 * GreetingStrip — top dashboard band.
 * No card chrome. Time-of-day greeting + current user name.
 * Right side: weekday + current date + iso week.
 */

import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MockSessionService } from '../../../../../core/services/mock-session.service';

function isoWeek(date: Date): number {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = (tmp.getUTCDay() + 6) % 7;
  tmp.setUTCDate(tmp.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 4));
  const diff = tmp.valueOf() - firstThursday.valueOf();
  return 1 + Math.round(diff / (7 * 24 * 3_600_000));
}

@Component({
  selector: 'app-greeting-strip',
  standalone: true,
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="strip" aria-labelledby="greeting-h">
      <div>
        <p class="t-caption eyebrow">Lab portal · {{ session.currentUser().title }}</p>
        <h1 id="greeting-h" class="t-display">{{ greeting() }}, {{ firstName() }}.</h1>
        <p class="t-body lede">{{ lede() }}</p>
      </div>
      <div class="meta">
        <p class="t-caption">{{ now() | date: 'EEEE' }}</p>
        <p class="t-h2 num">{{ now() | date: 'd MMM y' }}</p>
        <p class="t-small num"><span class="muted">ISO week</span> {{ week() }}</p>
      </div>
    </section>
  `,
  styleUrl: './greeting-strip.component.scss'
})
export class GreetingStripComponent {
  protected readonly session = inject(MockSessionService);
  protected readonly now = computed(() => new Date());
  protected readonly week = computed(() => isoWeek(this.now()));
  protected readonly firstName = computed(() => {
    const full = this.session.currentUser().fullName;
    const cleaned = full.replace(/^(Prof\.?|Dr\.?)\s+/i, '');
    return cleaned.split(' ')[0];
  });
  protected readonly greeting = computed(() => {
    const h = new Date().getHours();
    if (h < 5)  { return 'Late night'; }
    if (h < 12) { return 'Good morning'; }
    if (h < 17) { return 'Good afternoon'; }
    return 'Good evening';
  });
  protected readonly lede = computed(() => {
    const role = this.session.currentRole();
    switch (role) {
      case 'pm':              return 'Active pipeline overview for the projects you own.';
      case 'lab_admin':       return 'Lab-wide operations across the testing pipeline.';
      case 'test_engineer':   return 'Your bench: assigned projects, evidence, and findings.';
      case 'reviewer':        return 'Items awaiting your review and customer-visibility decisions.';
      case 'signatory':       return 'Reports awaiting your decision rule and signature.';
      case 'quality_manager': return 'Audit, gate, and AI-acceptance posture across the lab.';
    }
  });
}
