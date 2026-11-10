// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: auth.model.ts
// TypeScript shapes for the admin area: the logged-in user, as the API
// sends it in { user } (login, refresh, /me).
// ──────────────────────────────────────────────────────────────────────

/** Who is logged in. Printed on the access token; sent back by /api/auth/login and /me. */
export interface AdminUser {
  id: number;
  email: string;
  role: 'ADMIN';
}

/** The JSON body of /api/auth/login, /refresh and /me. (The tokens are in cookies, never here.) */
export interface AuthResponse {
  user: AdminUser;
}
