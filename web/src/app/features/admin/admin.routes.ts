// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: admin.routes.ts
// The admin area's pages, LAZY-loaded: visitors never download this code
// (app.routes.ts loads it only when someone opens /admin/...).
//   /admin/login   → LoginPage (open to everyone)
//   /admin/...     → AdminLayout (layouts/admin-layout), only if adminGuard says yes
//       /admin/posts → PostsPage
// ──────────────────────────────────────────────────────────────────────

import { Routes } from '@angular/router';
import { adminGuard } from '@core/auth/admin.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'login',
    title: 'Admin login · Devaangini Mehta',
    loadComponent: () => import('./login-page/login-page').then((m) => m.LoginPage),
  },
  {
    path: '',
    canMatch: [adminGuard],
    loadComponent: () => import('@layouts/admin-layout/admin-layout').then((m) => m.AdminLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'posts' },
      {
        path: 'posts',
        title: 'Posts · Admin',
        loadComponent: () => import('./posts-page/posts-page').then((m) => m.PostsPage),
      },
    ],
  },
];
