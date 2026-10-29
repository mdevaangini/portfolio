// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: admin.controller.ts
// HTTP layer for the admin area. Every function here runs only AFTER the
// requireAdmin guard said yes, so res.locals.user is always the admin.
// Milestone 4 adds the blog-post actions (create, edit, publish, delete).
// ──────────────────────────────────────────────────────────────────────

import type { Request, Response } from "express";
import type { SessionUser } from "../auth/auth.service.js";

/**
 * GET /api/admin/check
 * A tiny test endpoint to prove the guard works: you only see this if
 * you passed requireAdmin.
 */
export function check(_req: Request, res: Response) {
  const user = res.locals.user as SessionUser; // left by requireAdmin
  res.status(200).json({ ok: true, message: `You are the admin: ${user.email}` });
}
