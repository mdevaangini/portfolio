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
import { checkBody, createPostSchema, toTagList, updatePostSchema } from "./admin-posts.schema.js";
import { createPost, getPost, listPosts, publishPost, softDeletePost, unpublishPost, updatePost } from "./admin-posts.service.js";

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

/** Shared answers, so every action says the same thing for the same problem. */
function badId(res: Response) {
  res.status(400).json({ error: "id must be a positive whole number" });
}
function notFound(res: Response) {
  res.status(404).json({ error: "Post not found." });
}

/**
 * PATCH /api/admin/posts/:id — change SOME fields, e.g. { "title": "New title" }.
 * Same Zod rules as creating, but every field is optional. `status` can't be changed here.
 */
export async function update(req: Request, res: Response) {
  const id = readId(req);
  if (id === null) return badId(res);

  // 1. Zod checks whatever was sent.
  const check = checkBody(updatePostSchema, req.body);
  if (!check.ok) {
    res.status(400).json({ error: "Please check the post.", fields: check.fields });
    return;
  }
  const changes = check.data;
  if (Object.keys(changes).length === 0) {
    res.status(400).json({ error: "Nothing to change: send at least one field." });
    return;
  }

  // 2. Save only those fields.
  const result = await updatePost(id, { ...changes, tags: changes.tags ? toTagList(changes.tags) : undefined });

  if (result.kind === "not-found") return notFound(res);
  if (result.kind === "slug-taken") {
    res.status(409).json({ error: "That slug is already used by another post.", fields: { slug: "Choose a different slug." } });
    return;
  }
  if (result.kind === "incomplete") {
    res.status(400).json({ error: "A published post needs an excerpt and content.", fields: result.fields });
    return;
  }
  res.status(200).json(result.post);
}

/** POST /api/admin/posts/:id/publish — make it public (only if excerpt + content are filled in). */
export async function publish(req: Request, res: Response) {
  const id = readId(req);
  if (id === null) return badId(res);

  const result = await publishPost(id);
  if (result.kind === "not-found") return notFound(res);
  if (result.kind === "incomplete") {
    res.status(400).json({ error: "This post isn't ready to publish.", fields: result.fields });
    return;
  }
  res.status(200).json(result.post);
}

/** POST /api/admin/posts/:id/unpublish — back to draft (hidden from visitors). */
export async function unpublish(req: Request, res: Response) {
  const id = readId(req);
  if (id === null) return badId(res);

  const result = await unpublishPost(id);
  if (result.kind === "not-found") return notFound(res);
  res.status(200).json(result.post);
}

/** DELETE /api/admin/posts/:id — soft delete. 204 = "done, nothing to send back". */
export async function remove(req: Request, res: Response) {
  const id = readId(req);
  if (id === null) return badId(res);

  const result = await softDeletePost(id);
  if (result.kind === "not-found") return notFound(res);
  res.status(204).end();
}
