// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: blog.routes.ts
// The blog's pages, LAZY-loaded (app.routes.ts loads this only when someone
// opens /blog). They sit inside PublicLayout, so they get the site's header + footer.
//   /blog                         → BlogListPage
//   /blog?tag=angular&page=2      → the same page; tag and page come from the URL
//   /blog/:slug                   → BlogPostPage (one article; the slug comes from the URL)
// ──────────────────────────────────────────────────────────────────────

import { Routes } from '@angular/router';

export const BLOG_ROUTES: Routes = [
  {
    path: '',
    title: 'Blog · Devaangini Mehta',
    loadComponent: () => import('./blog-list-page/blog-list-page').then((m) => m.BlogListPage),
  },
  {
    path: ':slug',
    // Shown while the post loads; the page then sets the post's own title.
    title: 'Blog · Devaangini Mehta',
    loadComponent: () => import('./blog-post-page/blog-post-page').then((m) => m.BlogPostPage),
  },
];
