// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: tags.routes.ts
// URL map for the public tag list (mounted at /api/tags). No guard.
// Flow: routes (THIS) → controller → service → Prisma → Postgres
// ──────────────────────────────────────────────────────────────────────

import { Router } from "express";
import { list } from "./tags.controller.js";

/** URL map for tags, mounted at "/api/tags". */
export const tagsRouter = Router();

tagsRouter.get("/", list); // GET /api/tags → tags used by published posts
