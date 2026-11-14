// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: app.routes.ts
// List of pages: which FRAME (layout) and which page for which address.
//   "/"          → PublicLayout (header + footer) → Home
//   "/admin/..." → the admin area, LAZY-loaded (features/admin/admin.routes.ts),
//                  which uses AdminLayout
//   anything else → back to "/"
//   "/blog..."    → the blog, LAZY-loaded (features/blog/blog.routes.ts),
//                  inside PublicLayout (same header + footer as Home)
// ──────────────────────────────────────────────────────────────────────

import { Routes } from '@angular/router';
import { Home } from '@features/home/home';
import { PublicLayout } from '@layouts/public-layout/public-layout';

export const routes: Routes = [
  {
    // The public frame wraps every public page.
    path: '',
    component: PublicLayout,
    children: [
      // Home is loaded directly (not lazy): it's the first thing every visitor sees.
      { path: '', component: Home, title: 'Devaangini Mehta · Frontend Engineer' },
      // The blog's code loads only when someone opens /blog.
      { path: 'blog', loadChildren: () => import('@features/blog/blog.routes').then((m) => m.BLOG_ROUTES) },
    ],
  },
  // Visitors never download the admin code: it loads only when /admin is opened.
  { path: 'admin', loadChildren: () => import('@features/admin/admin.routes').then((m) => m.ADMIN_ROUTES) },
  { path: '**', redirectTo: '' },
];
