/*
 * Lab app routes:
 *  /        — portal-picker (links externally to Customer Portal)
 *  /lab/... — Lab Portal (shell + nested children)
 *
 * Customer Portal lives in a separate workspace at http://localhost:4300
 */

import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./portal/portal-picker.page').then(m => m.PortalPickerPage),
    title: 'Teligencia · choose portal'
  },
  {
    path: 'lab',
    loadComponent: () => import('./lab/layout/lab-shell.component').then(m => m.LabShellComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./lab/features/dashboard/dashboard.page').then(m => m.DashboardPage),
        title: 'Teligencia Lab · dashboard'
      },
      {
        path: 'coming-soon/:area',
        loadComponent: () => import('./lab/features/coming-soon/coming-soon.page').then(m => m.ComingSoonPage),
        title: 'Teligencia Lab · coming soon'
      },
      {
        path: 'coming-soon/:area/:id',
        loadComponent: () => import('./lab/features/coming-soon/coming-soon.page').then(m => m.ComingSoonPage),
        title: 'Teligencia Lab · coming soon'
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
