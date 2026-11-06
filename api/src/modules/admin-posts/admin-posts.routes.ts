// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: admin-posts.routes.ts
// URL map for MY posts, mounted at /api/admin/posts, so it sits BEHIND
// the requireAdmin guard of admin.routes.ts: every route here is protected.
// Flow: routes (THIS) → controller → service → Prisma → Postgres
// ──────────────────────────────────────────────────────────────────────

import { Router } from "express";
import { create, getOne, list } from "./admin-posts.controller.js";

/** URL map for the admin's posts, mounted at "/api/admin/posts". */
export const adminPostsRouter = Router();

adminPostsRouter.get("/", list); //       GET  /api/admin/posts      → all my posts
adminPostsRouter.get("/:id", getOne); //  GET  /api/admin/posts/3    → one post
adminPostsRouter.post("/", create); //    POST /api/admin/posts      → new draft (201)
