// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: app.config.ts
// App-wide setup (providers): router, HttpClient (+ the auth interceptor), global error listeners.
// Router extras:
//   • withComponentInputBinding: a routed page gets URL values as inputs,
//     e.g. /blog?tag=angular → tag = input() in the blog list page.
//   • withInMemoryScrolling: a new page starts at the top, Back returns to
//     where you were, and "/#work" scrolls to the section with id="work".
// ──────────────────────────────────────────────────────────────────────

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { authInterceptor } from '@core/auth/auth.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
    ),
    //The fix: scrollPositionRestoration: 'enabled'. This tells Angular: “when you draw a new page, also move the view back to the top.” -> When Angular opens the article, it also moves your view to position 0, so you see the title first, as on any normal website. And what about Back?
    //Before leaving the list, Angular wrote down “the list was at position 2100”. When you press Back, it draws the list again and scrolls you to 2100, so you see the 8th post again and can continue with the 9th. That’s the “in memory” part: Angular remembers the number.
    //The fix: anchorScrolling: 'enabled'. This tells Angular: “if the address has #something, scroll to the element with that name tag.”
    // authInterceptor: renews the admin's 15-minute badge automatically on a 401.
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
