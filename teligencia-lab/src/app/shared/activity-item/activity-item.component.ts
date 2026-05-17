/*
 * ActivityItem — single row in the activity-feed timeline.
 * Props: event (required AuditEvent), actorName (required).
 */

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { AvatarComponent } from '../avatar/avatar.component';
import { AuditEvent } from '../../core/models/domain';

@Component({
  selector: 'app-activity-item',
  standalone: true,
  imports: [DatePipe, NzIconModule, AvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <li class="row" [attr.data-action]="event.action">
      <span class="dot" [attr.data-gate]="event.gate || null" aria-hidden="true">
        <i nz-icon [nzType]="icon()" class="dot-icon"></i>
      </span>
      <div class="body">
        <p class="t-body line">
          <app-avatar [name]="actorName" size="sm"></app-avatar>
          <span class="actor">{{ actorName }}</span>
          <span class="text">{{ event.summary }}</span>
        </p>
        <p class="meta t-small">
          <span class="time num">{{ event.at | date: 'HH:mm' }}</span>
          <span class="sep">·</span>
          <span class="ref">{{ event.entityRef }}</span>
          @if (event.gate) {
            <span class="sep">·</span>
            <span class="gate">{{ event.gate }}</span>
          }
        </p>
      </div>
    </li>
  `,
  styleUrl: './activity-item.component.scss'
})
export class ActivityItemComponent {
  @Input({ required: true }) event!: AuditEvent;
  @Input({ required: true }) actorName!: string;

  icon(): string {
    switch (this.event.action) {
      case 'project.created':                return 'plus';
      case 'project.status_changed':         return 'swap';
      case 'contract_review.approved':       return 'check-circle';
      case 'contract_review.rejected':       return 'close-circle';
      case 'finding.created':                return 'alert';
      case 'finding.severity_changed':       return 'warning';
      case 'finding.approved_for_customer':  return 'eye';
      case 'evidence.uploaded':              return 'paper-clip';
      case 'evidence.locked':                return 'safety-certificate';
      case 'report.draft_created':           return 'file-search';
      case 'report.review_approved':         return 'check-circle';
      case 'report.signed':                  return 'safety-certificate';
      case 'report.issued':                  return 'file-protect';
      case 'gate.blocked':                   return 'exclamation-circle';
      case 'ai.output.accepted':             return 'thunderbolt';
    }
  }
}
