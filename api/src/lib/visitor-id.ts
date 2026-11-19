// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: visitor-id.ts
// The ANONYMOUS visitor id: how the API recognises "the same browser"
// without any account (used for "one reaction per browser" and, later,
// comment rate limits).
//
//   first time a browser ADDS something → make a random id (a UUID)
//   → Set-Cookie: visitor_id=…; HttpOnly; SameSite=Strict; Path=/api/posts; 1 year
//   later → the browser sends it back by itself
//
// It's a random number, not a login: it says nothing about WHO the person is.
// HttpOnly: page scripts can't read or change it. Path: it only travels
// to the blog endpoints. Clearing cookies gives a new id (accepted).
// Used by: modules/reactions (and the comments API, step C3)
// ──────────────────────────────────────────────────────────────────────

import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { env } from "../config/env.js";

export const VISITOR_COOKIE = "visitor_id";

/** What randomUUID() makes: 8-4-4-4-12 hex digits, e.g. "7f3c9a1e-…". */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * The browser's visitor id from its cookie, or null if there is none.
 * Anything that isn't in OUR format is ignored (someone may have edited the cookie).
 */
export function readVisitorId(req: Request): string | null {
  const value: unknown = req.cookies?.[VISITOR_COOKIE];
  return typeof value === "string" && UUID_PATTERN.test(value) ? value : null;
}

/** The browser's visitor id; if it has none yet, make one and send it as a cookie. */
export function ensureVisitorId(req: Request, res: Response): string {
  const existing = readVisitorId(req);
  if (existing) return existing;

  const id = randomUUID();
  res.cookie(VISITOR_COOKIE, id, {
    httpOnly: true, // page scripts can't read it
    secure: env.isProduction, // https only when live
    sameSite: "strict", // only sent when the request comes from my own site
    path: "/api/posts", // only travels to the blog endpoints
    maxAge: ONE_YEAR_MS,
  });
  return id;
}
