// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: admin-posts.routes.ts
// URL map for MY posts, mounted at /api/admin/posts, so it sits BEHIND
// the requireAdmin guard of admin.routes.ts: every route here is protected.
// Flow: routes (THIS) → controller → service → Prisma → Postgres
// ──────────────────────────────────────────────────────────────────────

import { Router } from "express";
import { create, getOne, list, publish, remove, unpublish, update } from "./admin-posts.controller.js";

/** URL map for the admin's posts, mounted at "/api/admin/posts". */
export const adminPostsRouter = Router();

adminPostsRouter.get("/", list); //       GET  /api/admin/posts      → all my posts
adminPostsRouter.get("/:id", getOne); //  GET  /api/admin/posts/3    → one post
adminPostsRouter.post("/", create); //    POST /api/admin/posts      → new draft (201)
adminPostsRouter.patch("/:id", update); //               PATCH  /api/admin/posts/3           → change some fields
adminPostsRouter.post("/:id/publish", publish); //       POST   /api/admin/posts/3/publish   → make it public
adminPostsRouter.post("/:id/unpublish", unpublish); //   POST   /api/admin/posts/3/unpublish → back to draft
adminPostsRouter.delete("/:id", remove); //              DELETE /api/admin/posts/3           → soft delete (204)
