// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: admin.routes.ts
// The ADMIN DOOR: URL map for everything under /api/admin.
// The guard (requireAdmin) is put in front ONCE, so every route below it
// is protected automatically, including the ones Milestone 4 adds.
// Flow: routes → requireAdmin (guard) → controller → service → Prisma
// ──────────────────────────────────────────────────────────────────────

import { Router } from "express";
import { requireAdmin } from "../../middleware/require-admin.js";
import { check } from "./admin.controller.js";

/** URL map for the admin area, mounted at "/api/admin". */
export const adminRouter = Router();

// The guard stands at the door: EVERY request below passes it first.
adminRouter.use(requireAdmin);

adminRouter.get("/check", check); // GET /api/admin/check → 200 only for the admin
