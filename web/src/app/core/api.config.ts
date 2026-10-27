// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: api.config.ts
// Where the API lives (API_BASE_URL). The value comes from src/environments/:
// "/api" everywhere: the website passes /api calls on to the API
// (proxy.conf.json on your laptop, vercel.json "rewrites" when live).
// ──────────────────────────────────────────────────────────────────────

import { InjectionToken } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * Base address of the backend API. Every service builds its URLs from this,
 * so the address is written once.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => environment.apiBaseUrl,
});
