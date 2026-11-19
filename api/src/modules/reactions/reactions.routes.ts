// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: reactions.routes.ts
// URL map for reactions, hung UNDER each post: /api/posts/:slug/reactions
// (mounted in posts.routes.ts). mergeParams: true lets these routes read
// the :slug that belongs to the parent route.
// PUT and DELETE change data, so checkOrigin runs first: only my own
// website may send them (another site → 403). GET only reads.
// Flow: routes (THIS) → controller → service → Prisma → Postgres
// ──────────────────────────────────────────────────────────────────────

import { Router } from "express";
import { checkOrigin } from "../../middleware/check-origin.js";
import { addOne, getReactions, removeOne } from "./reactions.controller.js";

export const reactionsRouter = Router({ mergeParams: true });

reactionsRouter.get("/", getReactions); //                      GET    …/reactions       → counts + mine
reactionsRouter.put("/:type", checkOrigin, addOne); //          PUT    …/reactions/like  → add mine
reactionsRouter.delete("/:type", checkOrigin, removeOne); //    DELETE …/reactions/like  → remove mine
