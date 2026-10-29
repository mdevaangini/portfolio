// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: auth.controller.ts
// HTTP layer for login, "who am I?" and logout. Login hands out the COOKIE
// (the key card); me reads it; logout takes it back. Never touches the database.
// Flow: routes → controller (THIS) → service → Prisma → Postgres
// ──────────────────────────────────────────────────────────────────────

import type { CookieOptions, Request, Response } from "express";
import { env } from "../../config/env.js";
import { deleteSession, findSessionUser, login as loginService } from "./auth.service.js";

/** The cookie's name. The browser sends it back by itself on every /api request. */
export const SESSION_COOKIE = "session";

/**
 * How the cookie is stored in the browser. Each option is a safety rule:
 *  httpOnly  page scripts (even Angular) can't read it → a hacked script can't steal it
 *  secure    sent over https only (live); off on the laptop, which uses http
 *  sameSite  "strict": only sent when the request comes from OUR site
 *  path      only sent to /api/... addresses, not with every page or image
 */
export function sessionCookieOptions(expires?: Date): CookieOptions {
  return { httpOnly: true, secure: env.isProduction, sameSite: "strict", path: "/api", expires };
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

  // 4. Success: give the browser its wristband (cookie) and say who logged in.
  //    The token itself is ONLY in the cookie, never in the JSON.
  res.cookie(SESSION_COOKIE, result.token, sessionCookieOptions(result.expiresAt));
  res.status(200).json({ user: result.user });
}

/** The key card the browser sent (cookie-parser put it in req.cookies), or "". */
export function sessionToken(req: Request): string {
  const value: unknown = req.cookies?.[SESSION_COOKIE];
  return typeof value === "string" ? value : "";
}

/**
 * GET /api/auth/me — "Who am I?"
 * Angular asks this when the admin page opens: am I still logged in?
 *   200 { user }  → yes          401 → no (no card, unknown card, or expired)
 */
export async function me(req: Request, res: Response) {
  const token = sessionToken(req);
  const user = token ? await findSessionUser(token) : null;

  if (!user) {
    // A card that no longer works: tell the browser to throw it away.
    if (token) res.clearCookie(SESSION_COOKIE, sessionCookieOptions());
    res.status(401).json({ error: "Not logged in." });
    return;
  }
  res.status(200).json({ user });
}

/**
 * POST /api/auth/logout
 * Deletes the session row (the card stops working everywhere) and tells the
 * browser to delete the cookie. Always 204 "done, nothing to send back",
 * even if you weren't logged in: the end result is the same.
 */
export async function logout(req: Request, res: Response) {
  const token = sessionToken(req);
  if (token) await deleteSession(token);

  res.clearCookie(SESSION_COOKIE, sessionCookieOptions());
  res.status(204).end();
}
