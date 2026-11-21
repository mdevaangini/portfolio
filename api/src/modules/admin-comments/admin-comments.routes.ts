// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: admin-comments.routes.ts
// URL map for MODERATION, mounted at /api/admin/comments, so it sits
// BEHIND the guards of admin.routes.ts (requireAdmin) and routes.ts
// (checkOrigin): every route here is protected automatically.
// Flow: routes (THIS) → controller → service → Prisma → Postgres
// ──────────────────────────────────────────────────────────────────────

import { Router } from "express";
import { approve, list, reject, remove, reply } from "./admin-comments.controller.js";

export const adminCommentsRouter = Router();

adminCommentsRouter.get("/", list); //                  GET    /api/admin/comments?status=pending → queue + counts
adminCommentsRouter.post("/:id/approve", approve); //   POST   /api/admin/comments/5/approve
adminCommentsRouter.post("/:id/reject", reject); //     POST   /api/admin/comments/5/reject
adminCommentsRouter.delete("/:id", remove); //          DELETE /api/admin/comments/5 (soft, 204)
adminCommentsRouter.post("/:id/reply", reply); //       POST   /api/admin/comments/5/reply → my reply (201)
