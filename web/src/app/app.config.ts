// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: app.config.ts
// App-wide setup (providers): router, HttpClient (+ the auth interceptor), global error listeners.
// ──────────────────────────────────────────────────────────────────────

import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { authInterceptor } from '@core/auth/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // authInterceptor: renews the admin's 15-minute badge automatically on a 401.
    provideHttpClient(withInterceptors([authInterceptor])),
  ]
};
