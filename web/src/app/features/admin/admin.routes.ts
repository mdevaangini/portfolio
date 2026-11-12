// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: admin.routes.ts
// The admin area's pages, LAZY-loaded: visitors never download this code
// (app.routes.ts loads it only when someone opens /admin/...).
//   /admin/login   → LoginPage (open to everyone)
//   /admin/...     → AdminLayout (layouts/admin-layout), only if adminGuard says yes
//       /admin/posts      → PostsPage (the table)
//       /admin/posts/new  → PostEditorPage (new post)
//       /admin/posts/5    → PostEditorPage (edit post 5)
//       both editor routes ask before leaving with unsaved changes
// ──────────────────────────────────────────────────────────────────────

import { Routes } from '@angular/router';
import { adminGuard } from '@core/auth/admin.guard';
import { unsavedChangesGuard } from './unsaved-changes.guard';

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
      {
        // "new" is listed before ":id", so it isn't read as an id.
        path: 'posts/new',
        title: 'New post · Admin',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('./post-editor-page/post-editor-page').then((m) => m.PostEditorPage),
      },
      {
        path: 'posts/:id',
        title: 'Edit post · Admin',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('./post-editor-page/post-editor-page').then((m) => m.PostEditorPage),
      },
    ],
  },
];
