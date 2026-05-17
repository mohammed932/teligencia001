/*
 * SLA watch — 7 items, MA_DD + SUBSCRIPTION subscriptions.
 * Only visible for roles ['pm','lab_admin'] in dashboard.
 */

import { SlaItem } from '../models/domain';

const inHours = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString();

export const SLA_ITEMS: SlaItem[] = [
  { id: 's-1', projectCode: 'TLG-2026-003', customerName: 'Philips',     dueAt: inHours(6),   type: 'MA_DD',        kind: 'response', hoursRemaining: 6 },
  { id: 's-2', projectCode: 'TLG-2026-006', customerName: 'Xiaomi',      dueAt: inHours(24),  type: 'MA_DD',        kind: 'retest',   hoursRemaining: 24 },
  { id: 's-3', projectCode: 'TLG-2026-010', customerName: 'Withings',    dueAt: inHours(46),  type: 'SUBSCRIPTION', kind: 'review',   hoursRemaining: 46 },
  { id: 's-4', projectCode: 'TLG-2026-002', customerName: 'Samsung',     dueAt: inHours(72),  type: 'MA_DD',        kind: 'response', hoursRemaining: 72 },
  { id: 's-5', projectCode: 'TLG-2026-001', customerName: 'Bosch',       dueAt: inHours(120), type: 'MA_DD',        kind: 'retest',   hoursRemaining: 120 },
  { id: 's-6', projectCode: 'TLG-2026-011', customerName: 'Sonos',       dueAt: inHours(168), type: 'SUBSCRIPTION', kind: 'review',   hoursRemaining: 168 },
  { id: 's-7', projectCode: 'TLG-2026-009', customerName: 'Dräger Medical', dueAt: inHours(192), type: 'MA_DD',     kind: 'response', hoursRemaining: 192 }
];
