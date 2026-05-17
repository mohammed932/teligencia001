/*
 * Customer Portal routes.
 *  /                — redirect to /portal/projects
 *  /portal/projects — customer dashboard
 *  /portal/intake   — coming-soon
 *  /portal/findings — coming-soon
 *  /portal/reports  — coming-soon
 *  /portal/messages — coming-soon
 */

import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'portal/projects', pathMatch: 'full' },
  {
    path: 'portal',
    loadComponent: () => import('./portal/customer-shell.component').then(m => m.CustomerShellComponent),
    children: [
      { path: '', redirectTo: 'projects', pathMatch: 'full' },
      {
        path: 'projects',
        loadComponent: () => import('./portal/projects.page').then(m => m.ProjectsPage),
        title: 'Teligencia Customer · projects'
      },
      {
        path: 'intake',
        loadComponent: () => import('./portal/coming-soon.page').then(m => m.ComingSoonPage),
        data: { area: 'intake' },
        title: 'Teligencia Customer · intake'
      },
      {
        path: 'findings',
        loadComponent: () => import('./portal/coming-soon.page').then(m => m.ComingSoonPage),
        data: { area: 'findings' },
        title: 'Teligencia Customer · findings'
      },
      {
        path: 'reports',
        loadComponent: () => import('./portal/coming-soon.page').then(m => m.ComingSoonPage),
        data: { area: 'reports' },
        title: 'Teligencia Customer · reports'
      },
      {
        path: 'messages',
        loadComponent: () => import('./portal/coming-soon.page').then(m => m.ComingSoonPage),
        data: { area: 'messages' },
        title: 'Teligencia Customer · messages'
      }
    ]
  },
  { path: '**', redirectTo: '/portal/projects' }
];
