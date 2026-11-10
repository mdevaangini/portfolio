// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: auth.service.ts
// Remembers WHO is logged in (a signal) and talks to /api/auth/...
// It never touches the tokens: they live in httpOnly cookies that only
// the browser handles. Angular just calls the endpoints.
// Used by: the login page, the admin guard, the auth interceptor, the admin layout.
// ──────────────────────────────────────────────────────────────────────

import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, of, tap } from 'rxjs';
import { AdminUser, AuthResponse } from './auth.model';
import { API_BASE_URL } from '@core/api/api.config';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /** The logged-in admin, or null. One signal = the whole "auth state" (no NgRx needed for one value). */
  readonly currentUser = signal<AdminUser | null>(null);
  readonly isLoggedIn = computed(() => this.currentUser() !== null);

  /**
   * POST /api/auth/login. On success the API sets the two cookies by itself
   * (Set-Cookie); we only keep the user from the JSON body.
   */
  login(email: string, password: string): Observable<AdminUser> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, { email, password }).pipe(
      map((res) => res.user),
      tap((user) => this.currentUser.set(user)),
    );
  }

  /**
   * "Am I still logged in?" Used by the guard, e.g. after a page reload (the signal
   * starts empty, but the cookies may still be valid). Calls GET /api/auth/me; if the
   * badge has expired, the interceptor quietly refreshes it first. Never throws.
   */
  restore(): Observable<boolean> {
    if (this.currentUser()) return of(true);
    return this.http.get<AuthResponse>(`${this.baseUrl}/auth/me`).pipe(
      tap((res) => this.currentUser.set(res.user)),
      map(() => true),
      catchError(() => of(false)),
    );
  }

  /** POST /api/auth/refresh: locker key → new badge + new key (cookies). Called by the interceptor. */
  refreshTokens(): Observable<AdminUser> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/refresh`, {}).pipe(
      map((res) => res.user),
      tap((user) => this.currentUser.set(user)),
    );
  }

  /** POST /api/auth/logout: the API deletes the refresh token and both cookies. */
  logout(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/auth/logout`, {}).pipe(finalize(() => this.clearUser()));
  }

  /** Forget the user on the Angular side (e.g. when a refresh fails). */
  clearUser(): void {
    this.currentUser.set(null);
  }
}
