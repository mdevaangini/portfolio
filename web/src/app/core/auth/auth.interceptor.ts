// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: auth.interceptor.ts
// Keeps me logged in. The badge (access token) lives 15 minutes; when an
// admin request comes back 401 ("badge expired"), this interceptor:
//   1. calls POST /api/auth/refresh ONCE (the browser sends the locker key),
//   2. repeats the original request with the new badge,
//   3. if the refresh fails too → forgets the user and goes to /admin/login.
// Several requests failing at the same moment share ONE refresh call.
// It never reads or adds tokens: the browser attaches the cookies itself.
// Registered in app.config.ts (withInterceptors).
// ──────────────────────────────────────────────────────────────────────

import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, shareReplay, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/** The refresh call in progress, shared by every request that is waiting for it. */
let refreshInProgress: Observable<unknown> | null = null;

/** Only these requests may trigger a refresh: admin calls and "who am I?". Never login/refresh/logout themselves. */
function canRefreshFor(req: HttpRequest<unknown>): boolean {
  return req.url.includes('/api/admin') || req.url.endsWith('/api/auth/me');
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      const badgeExpired = error instanceof HttpErrorResponse && error.status === 401 && canRefreshFor(req);
      if (!badgeExpired) return throwError(() => error);

      // 1. One refresh for everyone who is waiting (shareReplay), cleared when it's done.
      refreshInProgress ??= auth.refreshTokens().pipe(
        finalize(() => (refreshInProgress = null)),
        shareReplay(1),
      );

      return refreshInProgress.pipe(
        // 3. The locker key didn't work either → really logged out.
        catchError(() => {
          auth.clearUser();
          // Admin pages: go to the login page and come back afterwards.
          // (/me is asked by the guard, which handles the redirect itself.)
          if (req.url.includes('/api/admin')) {
            void router.navigate(['/admin/login'], { queryParams: { returnUrl: router.url } });
          }
          return throwError(() => error);
        }),
        // 2. New badge in the cookie → repeat the original request.
        switchMap(() => next(req)),
      );
    }),
  );
};
