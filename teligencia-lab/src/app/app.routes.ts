/*
 * Lab app routes:
 *  /               — portal-picker (public)
 *  /lab/...        — Lab Portal (authGuard)
 *  /access-denied  — shown when a signed-in user lacks the required role
 *
 * Customer Portal lives in a separate workspace at http://localhost:4300
 */

import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./portal/portal-picker.page').then((m) => m.PortalPickerPage),
    title: 'Teligencia · choose portal',
  },
  {
    path: 'access-denied',
    loadComponent: () =>
      import('./shared/access-denied/access-denied.component').then(
        (m) => m.AccessDeniedComponent,
      ),
    title: 'Teligencia · access denied',
  },
  {
    path: 'lab',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./lab/layout/lab-shell.component').then(
        (m) => m.LabShellComponent,
      ),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./lab/features/dashboard/dashboard.page').then(
            (m) => m.DashboardPage,
          ),
        title: 'Teligencia Lab · dashboard',
      },
      {
        path: 'coming-soon/users',
        canActivate: [roleGuard(['lab_admin'])],
        loadComponent: () =>
          import('./lab/features/coming-soon/coming-soon.page').then(
            (m) => m.ComingSoonPage,
          ),
        title: 'Teligencia Lab · users & roles',
      },
      {
        path: 'coming-soon/audit',
        canActivate: [roleGuard(['quality_manager', 'lab_admin'])],
        loadComponent: () =>
          import('./lab/features/coming-soon/coming-soon.page').then(
            (m) => m.ComingSoonPage,
          ),
        title: 'Teligencia Lab · audit trail',
      },
      {
        path: 'coming-soon/:area',
        loadComponent: () =>
          import('./lab/features/coming-soon/coming-soon.page').then(
            (m) => m.ComingSoonPage,
          ),
        title: 'Teligencia Lab · coming soon',
      },
      {
        path: 'coming-soon/:area/:id',
        loadComponent: () =>
          import('./lab/features/coming-soon/coming-soon.page').then(
            (m) => m.ComingSoonPage,
          ),
        title: 'Teligencia Lab · coming soon',
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
