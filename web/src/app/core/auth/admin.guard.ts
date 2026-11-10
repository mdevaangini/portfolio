// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: admin.guard.ts
// Keeps visitors out of the admin pages (a functional CanMatch guard).
// Logged in (or the cookies still work after a reload) → the admin routes
// match and their code is downloaded; otherwise → /admin/login.
// This only hides PAGES. The real protection is the API's requireAdmin:
// without a valid badge every /api/admin call answers 401 anyway.
// ──────────────────────────────────────────────────────────────────────

import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';

export const adminGuard: CanMatchFn = (_route, segments) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const wantedUrl = '/admin/' + segments.map((s) => s.path).join('/');

  return auth
    .restore()
    .pipe(map((loggedIn) => (loggedIn ? true : router.createUrlTree(['/admin/login'], { queryParams: { returnUrl: wantedUrl } }))));
};
