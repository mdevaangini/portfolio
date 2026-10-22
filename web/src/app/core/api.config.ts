// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: api.config.ts
// Where the API lives (API_BASE_URL). One place to change it, e.g. when deploying.
// ──────────────────────────────────────────────────────────────────────

import { InjectionToken } from '@angular/core';

/**
 * Base address of the backend API. Every service builds its URLs from this,
 * so the address is written once. When we deploy, only this value changes.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => 'http://localhost:3000/api',
});
