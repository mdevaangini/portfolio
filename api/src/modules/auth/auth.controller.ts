// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: auth.controller.ts
// HTTP layer for login. Puts the two tokens into two COOKIES (the browser
// keeps and sends them by itself), and reads them back.
//   access_token  = the BADGE (JWT, 15 min)       → sent to every /api/... request
//   refresh_token = the LOCKER KEY (7 days)       → sent ONLY to /api/auth/...
// Endpoints: login, refresh, me, logout. Never touches the database.
// Flow: routes → controller (THIS) → service → Prisma → Postgres
// ──────────────────────────────────────────────────────────────────────

import type { CookieOptions, Request, Response } from "express";
import { env } from "../../config/env.js";
import { ACCESS_TOKEN_SECONDS, verifyAccessToken } from "../../lib/jwt.js";
import { type IssuedTokens, login as loginService, logout as logoutService, refresh as refreshService } from "./auth.service.js";

export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";

/**
 * The cookie safety rules (same for both cookies):
 *  httpOnly  page scripts (even Angular) can't read it → a hacked script can't steal it
 *  secure    sent over https only (live); off on the laptop, which uses http
 *  sameSite  "strict": only sent when the request comes from OUR site
 *  path      which addresses the browser sends it to
 */
function cookieOptions(path: string, maxAgeMs?: number): CookieOptions {
  return { httpOnly: true, secure: env.isProduction, sameSite: "strict", path, maxAge: maxAgeMs };
}
/** The badge goes to every API address. */
const accessCookie = (maxAgeMs?: number) => cookieOptions("/api", maxAgeMs);
/** The locker key only goes to reception (/api/auth/refresh, /logout), never to the admin doors. */
const refreshCookie = (maxAgeMs?: number) => cookieOptions("/api/auth", maxAgeMs);

/** Hands both tokens to the browser as cookies (Set-Cookie headers). */
function setAuthCookies(res: Response, tokens: IssuedTokens) {
  res.cookie(ACCESS_COOKIE, tokens.accessToken, accessCookie(ACCESS_TOKEN_SECONDS * 1000));
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, refreshCookie(tokens.refreshExpiresAt.getTime() - Date.now()));
}

/** Tells the browser to throw both cookies away. */
function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, accessCookie());
  res.clearCookie(REFRESH_COOKIE, refreshCookie());
}

/** Reads one cookie the browser sent (cookie-parser put it in req.cookies), or "". */
export function readCookie(req: Request, name: string): string {
  const value: unknown = req.cookies?.[name];
  return typeof value === "string" ? value : "";
}

/** Reads a field from the body: must be text (no trimming: spaces can be part of a password). */
function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * POST /api/auth/login
 * Body (JSON): { "email": "...", "password": "..." }
 */
export async function login(req: Request, res: Response) {
  const body = req.body ?? {};
  const email = text(body.email).trim().toLowerCase();
  const password = text(body.password);

  // 1. Basic checks: both filled in, not absurdly long.
  if (!email || !password || email.length > 254 || password.length > 200) {
    res.status(400).json({ error: "Please enter your email and password." });
    return;
  }

  const result = await loginService(email, password);

  // 2. Too many wrong attempts → 429 + how many seconds to wait.
  if (result.kind === "locked") {
    const seconds = Math.ceil((result.until.getTime() - Date.now()) / 1000);
    res.setHeader("Retry-After", String(seconds));
    res.status(429).json({ error: "Too many failed attempts. Please try again in 15 minutes." });
    return;
  }

  // 3. Wrong email OR wrong password → the SAME 401 message, so nobody can find
  //    out which emails have an account.
  if (result.kind === "wrong") {
    res.status(401).json({ error: "Wrong email or password." });
    return;
  }

  // 4. Success: badge + locker key as cookies; the JSON only says who logged in.
  setAuthCookies(res, result.tokens);
  res.status(200).json({ user: result.user });
}

/**
 * POST /api/auth/refresh — "my badge expired, here's my locker key".
 * Angular will call this automatically when an admin request gets 401 (Milestone 6).
 *   200 { user } + new badge + new key     401 → log in again
 */
export async function refresh(req: Request, res: Response) {
  const key = readCookie(req, REFRESH_COOKIE);
  const result = key ? await refreshService(key) : null;

  if (!result) {
    clearAuthCookies(res); // a key that doesn't work: throw both cookies away
    res.status(401).json({ error: "Please log in again." });
    return;
  }
  setAuthCookies(res, result.tokens);
  res.status(200).json({ user: result.user });
}

/**
 * GET /api/auth/me — "Who am I?" Checks the BADGE only (no database).
 *   200 { user } → valid badge      401 → no badge, fake, or expired (then try /refresh)
 */
export async function me(req: Request, res: Response) {
  const badge = readCookie(req, ACCESS_COOKIE);
  const user = badge ? await verifyAccessToken(badge) : null;

  if (!user) {
    res.status(401).json({ error: "Not logged in." });
    return;
  }
  res.status(200).json({ user });
}

/**
 * POST /api/auth/logout
 * Crosses the locker key out of the book and throws both cookies away.
 * Always 204 "done", even if you weren't logged in: the end result is the same.
 */
export async function logout(req: Request, res: Response) {
  const key = readCookie(req, REFRESH_COOKIE);
  if (key) await logoutService(key);

  clearAuthCookies(res);
  res.status(204).end();
}
