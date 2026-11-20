// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: comments.routes.ts
// URL map for comments, hung UNDER each post: /api/posts/:slug/comments
// (mounted in posts.routes.ts). mergeParams: true lets these routes read
// the parent route's :slug. POST changes data → checkOrigin first.
// Flow: routes (THIS) → controller → service → Prisma → Postgres
// ──────────────────────────────────────────────────────────────────────

import { Router } from "express";
import { checkOrigin } from "../../middleware/check-origin.js";
import { create, list } from "./comments.controller.js";

export const commentsRouter = Router({ mergeParams: true });

commentsRouter.get("/", list); //                    GET  …/comments → approved comments + replies
commentsRouter.post("/", checkOrigin, create); //    POST …/comments → new comment/reply → PENDING
