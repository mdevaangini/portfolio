// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: password.ts
// Turns a password into a safe "fingerprint" (hash) and checks a password
// against it. Uses scrypt, built into Node (no extra package).
// Used by: scripts/create-admin.ts (now) and the login (Blog milestone 3).
// ──────────────────────────────────────────────────────────────────────

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

/**
 * scrypt settings. Higher = slower to guess, but also slower to log in.
 * These are the common recommended values (≈50 ms per check).
 *   N: how much work · r: memory block size · p: parallel lanes · keyLength: hash size in bytes
 */
const SETTINGS = { N: 16384, r: 8, p: 1, keyLength: 64 };

/** scrypt with a Promise, so we can `await` it (Node only offers a callback). */
function runScrypt(password: string, salt: Buffer, s: typeof SETTINGS): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, s.keyLength, { N: s.N, r: s.r, p: s.p }, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

/**
 * Password → text to store in users.password_hash, e.g.
 *   scrypt$16384$8$1$<salt>$<hash>
 * The SALT is random for every password, so two people with the same password
 * still get different hashes. The settings are stored too, so they can be
 * raised later without breaking old passwords.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await runScrypt(password, salt, SETTINGS);
  const { N, r, p } = SETTINGS;
  return ["scrypt", N, r, p, salt.toString("base64"), hash.toString("base64")].join("$");
}

/**
 * Does this password match the stored hash? Hashes the password again with the
 * SAME salt and settings and compares. A hash can't be turned back into the password.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const [, N, r, p, saltText, hashText] = parts;
  const expected = Buffer.from(hashText, "base64");
  const actual = await runScrypt(password, Buffer.from(saltText, "base64"), {
    N: Number(N),
    r: Number(r),
    p: Number(p),
    keyLength: expected.length,
  });

  // timingSafeEqual takes the same time whether the first or last byte differs,
  // so an attacker can't learn anything from how long the check took.
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
