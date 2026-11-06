// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: admin-posts.controller.ts
// HTTP layer for MY posts (admin only). Reads the request, checks it with
// the Zod schema (admin-posts.schema.ts), calls the service, picks the
// status code. Runs only AFTER requireAdmin said yes, so res.locals.user is me.
// Flow: routes → requireAdmin → controller (THIS) → service → Prisma
// ──────────────────────────────────────────────────────────────────────

import type { Request, Response } from "express";
import type { AccessTokenUser } from "../../lib/jwt.js";
import { toSlug } from "../../lib/slug.js";
import { checkBody, createPostSchema, toTagList } from "./admin-posts.schema.js";
import { createPost, getPost, listPosts } from "./admin-posts.service.js";

/** The :id from the URL as a positive whole number, or null if it isn't one. */
function readId(req: Request): number | null {
  const id = Number(req.params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** GET /api/admin/posts — all my posts (drafts too), without their content. */
export async function list(_req: Request, res: Response) {
  res.status(200).json({ data: await listPosts() });
}

/** GET /api/admin/posts/:id — one post with everything, for the editor. */
export async function getOne(req: Request, res: Response) {
  const id = readId(req);
  if (id === null) {
    res.status(400).json({ error: "id must be a positive whole number" });
    return;
  }

  const post = await getPost(id);
  if (!post) {
    res.status(404).json({ error: "Post not found." });
    return;
  }
  res.status(200).json(post);
}

/**
 * POST /api/admin/posts — write a new post (always saved as a DRAFT).
 * Body (JSON): { title, slug?, excerpt?, content?, coverImageUrl?, tags?: ["angular", …] }
 */
export async function create(req: Request, res: Response) {
  // 1. Zod checks every field and reports all problems at once.
  const check = checkBody(createPostSchema, req.body);
  if (!check.ok) {
    res.status(400).json({ error: "Please check the post.", fields: check.fields });
    return;
  }
  const input = check.data;

  // 2. No slug given? Make one from the title ("Signals vs RxJS" → "signals-vs-rxjs").
  const slug = input.slug ?? toSlug(input.title, 80);
  if (slug.length < 3) {
    res.status(400).json({ error: "Please check the post.", fields: { slug: "Please choose a slug (3–80 characters)." } });
    return;
  }

  // 3. Save it. The author is whoever passed the guard (me).
  const author = res.locals.user as AccessTokenUser;
  const result = await createPost({ ...input, slug, tags: toTagList(input.tags) }, author.id);

  // 4. Slug already used by another post → 409 "Conflict".
  if (result.kind === "slug-taken") {
    res.status(409).json({
      error: "That slug is already used by another post.",
      fields: { slug: "Choose a different slug (or change the title)." },
    });
    return;
  }

  // 5. 201 "Created" + the saved post (with its id, status DRAFT and tags).
  res.status(201).json(result.post);
}
