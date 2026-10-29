// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: session-token.ts
// Makes the secret "wristband number" for a login, and its hash.
// The browser keeps the TOKEN (in a cookie); the database keeps only its HASH.
// Used by: modules/auth (login now; checking the wristband in milestone 3b/3c).
// ──────────────────────────────────────────────────────────────────────

import { createHash, randomBytes } from "node:crypto";

/**
 * A new random token: 32 random bytes as text (~43 characters).
 * Impossible to guess, so it's safe to use as proof of "I'm logged in".
 */
export function createSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * The token's fingerprint (SHA-256), stored in sessions.token_hash.
 * If someone ever read the database, they'd get hashes, not working wristbands.
 * (A fast hash is fine here: the token is random, not a human password.)
 */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
