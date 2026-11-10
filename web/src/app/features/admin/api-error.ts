// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: api-error.ts
// Turns an API error into ONE readable sentence for the admin pages.
// The API answers { error, fields? } (e.g. 400 "This post isn't ready to
// publish." + { excerpt: "Add an excerpt before publishing." }).
// Used by: login page, posts page (and the editor in 6c).
// ──────────────────────────────────────────────────────────────────────

import { HttpErrorResponse } from '@angular/common/http';

export function apiErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return "Can't reach the server. Is the API running?";

    const body = error.error as { error?: unknown; fields?: Record<string, string> } | null;
    if (error.status < 500 && typeof body?.error === 'string') {
      // Add the field messages, e.g. "This post isn't ready to publish. Add an excerpt before publishing."
      const details = body.fields ? Object.values(body.fields).join(' ') : '';
      return details ? `${body.error} ${details}` : body.error;
    }
  }
  return 'Something went wrong. Please try again.';
}
