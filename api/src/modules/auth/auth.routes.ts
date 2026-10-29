// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: auth.routes.ts
// URL map for login, "who am I?" and logout (mounted at /api/auth).
// Flow: routes (THIS) → controller → service → Prisma → Postgres
// ──────────────────────────────────────────────────────────────────────

import { Router } from "express";
import { login, logout, me } from "./auth.controller.js";

/** URL map for the auth feature, mounted at "/api/auth". */
export const authRouter = Router();

authRouter.post("/login", login); // POST /api/auth/login  → sets the session cookie
authRouter.get("/me", me); //         GET  /api/auth/me     → who am I? (200 or 401)
authRouter.post("/logout", logout); // POST /api/auth/logout → deletes session + cookie (204)
