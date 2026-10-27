// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: app.routes.ts
// List of pages: which component shows for which address.
//   "/"        → Home (all portfolio sections)
//   anything else → back to "/"   (later: a proper "not found" page)
// Coming with the Blog: "/blog", "/blog/:slug" and "/admin" (lazy-loaded).
// ──────────────────────────────────────────────────────────────────────

import { Routes } from '@angular/router';
import { Home } from './pages/home/home';

export const routes: Routes = [
  // Home is loaded directly (not lazy): it's the first thing every visitor sees.
  { path: '', component: Home, title: 'Devaangini Mehta · Frontend Engineer' },
  { path: '**', redirectTo: '' },
];
