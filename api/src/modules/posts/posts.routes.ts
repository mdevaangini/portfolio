// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: posts.routes.ts
// URL map for the PUBLIC blog posts (mounted at /api/posts). No guard:
// anyone can read, and the service only ever returns published posts.
// Flow: routes (THIS) → controller → service → Prisma → Postgres
// ──────────────────────────────────────────────────────────────────────

import { Router } from "express";
import { getOne, list } from "./posts.controller.js";
import { commentsRouter } from "../comments/comments.routes.js";
import { reactionsRouter } from "../reactions/reactions.routes.js";

/** URL map for public posts, mounted at "/api/posts". */
export const postsRouter = Router();

postsRouter.get("/", list); //         GET /api/posts?limit&offset&tag  → a page of published posts
postsRouter.get("/:slug", getOne); //  GET /api/posts/signals-vs-rxjs   → one published post

// Reactions on a post (Comments milestone C2): /api/posts/:slug/reactions[/:type]
postsRouter.use("/:slug/reactions", reactionsRouter);

// Comments on a post (Comments milestone C3): /api/posts/:slug/comments
postsRouter.use("/:slug/comments", commentsRouter);
