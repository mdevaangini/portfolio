// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: refresh-token.ts
// Makes the "LOCKER KEY" (refresh token): a long random string, and its
// fingerprint (hash). The browser keeps the KEY (in a cookie); reception's
// book (the refresh_tokens table) keeps only its FINGERPRINT.
// (Before Blog step B2 this file was session-token.ts.)
// Used by: modules/auth (login, refresh, logout).
// ──────────────────────────────────────────────────────────────────────

import { createHash, randomBytes } from "node:crypto";

/**
 * A new random key: 32 random bytes as text (~43 characters).
 * Impossible to guess. It means nothing by itself: it only works
 * while its fingerprint is in the book.
 */
export function createRefreshToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * The key's fingerprint (SHA-256), stored in refresh_tokens.token_hash.
 * If someone ever read the database, they'd get fingerprints, not working keys.
 * (A fast hash is fine here: the key is random, not a human password.)
 */
export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
