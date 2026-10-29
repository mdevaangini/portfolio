// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: check-origin.ts
// A second lock (next to the cookie's sameSite rule) for requests that
// CHANGE something (POST / PATCH / DELETE) on /api/auth and /api/admin:
// they must come from MY website. A request started from another
// website → 403, before anything else runs.
// ──────────────────────────────────────────────────────────────────────

import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";

/** Websites allowed to send changes: the live site (CORS_ORIGIN) and the laptop. */
const ALLOWED_ORIGINS = new Set([env.corsOrigin, "http://localhost:4200"]);

/** Methods that only READ. They're never blocked here. */
const READ_ONLY = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Browsers add an `Origin` header to these requests: the address of the page
 * that started them (e.g. https://devaangini-portfolio.vercel.app). Another
 * website can't fake it. Postman sends no Origin, so it's still allowed for testing.
 */
export function checkOrigin(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;

  if (!READ_ONLY.has(req.method) && origin && !ALLOWED_ORIGINS.has(origin)) {
    res.status(403).json({ error: "This request must come from the website." });
    return;
  }
  next();
}
