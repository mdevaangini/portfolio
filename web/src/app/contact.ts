// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: contact.ts
// Interfaces: what the form SENDS to POST /api/contact, and what the API replies.
// ──────────────────────────────────────────────────────────────────────

/** The body Angular sends. `website` is the hidden spam trap: always empty for real people. */
export interface ContactRequest {
  name: string;
  email: string;
  message: string;
  website: string;
}

/** 400 reply from the API: one message per field that has a problem. */
export interface ContactErrorResponse {
  error: string;
  fields?: Partial<Record<'name' | 'email' | 'message', string>>;
}
