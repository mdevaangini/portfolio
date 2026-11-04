// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: jwt.ts
// The BADGE MACHINE for login (the "access token", a JWT).
//   signAccessToken(user)   → prints a badge: who you are + expiry + secret stamp
//   verifyAccessToken(jwt)  → the guard's check: real stamp? not expired? → who's inside
// No database: everything needed is written inside the badge.
// Used by: auth (login, refresh: Blog step B2) and require-admin (B3).
// Library: `jose`, a well-known JWT library (signing is security code
// you shouldn't write yourself).
// ──────────────────────────────────────────────────────────────────────

import { SignJWT, jwtVerify } from "jose";
import { env } from "../config/env.js";

/** How long a badge is valid: 15 minutes. Short, because it can't be cancelled. */
export const ACCESS_TOKEN_SECONDS = 15 * 60;

/** The information printed on the badge. */
export interface AccessTokenUser {
  id: number;
  email: string;
  role: "ADMIN";
}

/** Who signed the badge, and who it's for. A badge from anywhere else is refused. */
const ISSUER = "devaangini-portfolio-api";
const AUDIENCE = "devaangini-portfolio-admin";

/** The secret stamp as bytes (jose needs bytes, not text). */
const secretKey = new TextEncoder().encode(env.jwtSecret);

/**
 * Prints a badge. The result is one long string with 3 parts, "header.payload.signature":
 *   header    = how it's signed (HS256 = with a shared secret)
 *   payload   = what's printed on it: sub (user id), email, role, iat (issued at), exp (expires)
 *   signature = the stamp, made from header + payload + JWT_SECRET
 * The payload is only encoded, NOT secret: anyone can read it. Nobody can CHANGE it
 * without breaking the stamp. So never put a password or secret in it.
 *
 * `expiresInSeconds` is normally 15 minutes; tests pass other values.
 */
export function signAccessToken(user: AccessTokenUser, expiresInSeconds = ACCESS_TOKEN_SECONDS): Promise<string> {
  const now = Math.floor(Date.now() / 1000); // JWT times are in seconds
  return new SignJWT({ email: user.email, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id)) // "sub" = who the badge belongs to
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt(now)
    .setExpirationTime(now + expiresInSeconds)
    .sign(secretKey);
}

/**
 * The guard's check. Returns the user printed on the badge, or null if the badge
 * is fake (stamp doesn't match), changed, expired, or not ours.
 * jose does all the checks; we only read the result.
 */
export async function verifyAccessToken(token: string): Promise<AccessTokenUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"], // only accept the way WE sign (blocks the "alg: none" trick)
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    const id = Number(payload.sub);
    if (!Number.isInteger(id) || payload.role !== "ADMIN" || typeof payload.email !== "string") return null;
    return { id, email: payload.email, role: "ADMIN" };
  } catch {
    return null; // expired, fake, changed or malformed → treated as "no valid badge"
  }
}
