// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: require-admin.ts
// The GUARD at the admin door. Runs before EVERY /api/admin/... route:
// no valid key card (cookie), or not an admin → 401, and the admin code
// never runs. This is what really protects the posts: hiding buttons in
// Angular doesn't stop someone calling the API with Postman; this does.
// Flow: request → requireAdmin (THIS) → admin routes → controller → service
// ──────────────────────────────────────────────────────────────────────

import type { NextFunction, Request, Response } from "express";
import { sessionToken } from "../modules/auth/auth.controller.js";
import { findSessionUser } from "../modules/auth/auth.service.js";

/**
 * Express "middleware": a function that runs BEFORE the route's own code.
 * It either answers itself (here: 401) or calls next() = "all good, go on".
 * Like an Angular route guard returning true/false, but inside the API.
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  // 1. The key card the browser attached (read by cookie-parser).
  const token = sessionToken(req);

  // 2. Logged in? Its fingerprint must be in `sessions` and not expired.
  const user = token ? await findSessionUser(token) : null;

  // 3. Admin? Today every user is an admin; the check keeps it safe if
  //    other kinds of users are ever added.
  if (!user || user.role !== "ADMIN") {
    res.status(401).json({ error: "Not logged in." });
    return; // stop here: next() is NOT called, so the admin code never runs
  }

  // 4. Let the request through, and leave a note saying WHO is acting.
  //    res.locals = a place to pass data along to the next step of this request.
  res.locals.user = user;
  next();
}
