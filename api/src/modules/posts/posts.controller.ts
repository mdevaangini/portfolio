// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: posts.controller.ts
// HTTP layer for the PUBLIC blog (no login). Checks the URL values with Zod
// (?limit&offset&tag, :slug), calls the service, picks the status code.
// A draft, a deleted post and a slug that never existed all get the SAME 404,
// so nobody can tell a draft exists.
// Flow: routes → controller (THIS) → service → Prisma → Postgres
// ──────────────────────────────────────────────────────────────────────

import type { Request, Response } from "express";
import { z } from "zod";
import { SLUG_PATTERN } from "../../lib/slug.js";
import { checkBody } from "../../lib/validation.js";
import { getPublishedPost, listPublishedPosts } from "./posts.service.js";

/**
 * The rules for ?limit=&offset=&tag=. URL values always arrive as TEXT ("10"),
 * so z.coerce turns them into numbers first. Missing → the default.
 */
const listQuerySchema = z.object({
  limit: z.coerce.number({ error: "limit must be a number." }).int().min(1, { error: "limit must be 1–50." }).max(50, { error: "limit must be 1–50." }).default(10),
  offset: z.coerce.number({ error: "offset must be a number." }).int().min(0, { error: "offset must be 0 or more." }).default(0),
  tag: z.string().regex(SLUG_PATTERN, { error: "tag must be a tag slug, e.g. angular." }).optional(),
});

/**
 * GET /api/posts?limit=10&offset=0&tag=angular
 * → 200 { data: [post cards], total, limit, offset }
 */
export async function list(req: Request, res: Response) {
  const check = checkBody(listQuerySchema, req.query);
  if (!check.ok) {
    res.status(400).json({ error: "Please check the address.", fields: check.fields });
    return;
  }

  const { limit, offset, tag } = check.data;
  const page = await listPublishedPosts({ limit, offset, tag });
  res.status(200).json({ ...page, limit, offset });
}

/**
 * GET /api/posts/:slug   e.g. /api/posts/signals-vs-rxjs
 * → 200 one post with content + readingMinutes, or 404 (draft, deleted, unknown or malformed slug)
 */
export async function getOne(req: Request, res: Response) {
  const slug = String(req.params.slug);
  const post = SLUG_PATTERN.test(slug) ? await getPublishedPost(slug) : null;

  if (!post) {
    res.status(404).json({ error: "Post not found." });
    return;
  }
  res.status(200).json(post);
}
