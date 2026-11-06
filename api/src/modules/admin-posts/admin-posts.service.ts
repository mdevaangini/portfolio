// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: admin-posts.service.ts
// Database layer for MY posts (admin only): list all (drafts too), get one,
// create, edit, publish / unpublish, and (soft) delete.
// The ONLY place in this feature that talks to Postgres.
// Soft delete: rows with a deleted_at date are skipped everywhere (notDeleted).
// Flow: routes → requireAdmin → controller → service (THIS) → Prisma → Postgres
// ──────────────────────────────────────────────────────────────────────

import type { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../db/prisma.js";

/** SOFT DELETE filter, written once: "only posts that haven't been deleted". */
const notDeleted = { deletedAt: null } satisfies Prisma.PostWhereInput;

/**
 * Which columns the admin gets back for one post. Tags are read THROUGH the
 * join table: post → post_tags rows → each row's tag → its name + slug.
 */
const postSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  content: true,
  coverImageUrl: true,
  status: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  tags: { select: { tag: { select: { name: true, slug: true } } } },
} satisfies Prisma.PostSelect;

/** The list doesn't need the (long) content: same columns minus `content`. */
const listSelect = { ...postSelect, content: false } satisfies Prisma.PostSelect;

/** Prisma gives tags as [{ tag: { name, slug } }]; the API sends [{ name, slug }]. */
function withFlatTags<T extends { tags: { tag: { name: string; slug: string } }[] }>(post: T) {
  return { ...post, tags: post.tags.map((row) => row.tag) };
}

/**
 * For each tag: use the existing tag (found by its slug) or create it.
 * Each item becomes one new post_tags row ("this post has this tag").
 */
function tagRows(tags: { name: string; slug: string }[]) {
  return tags.map((t) => ({
    tag: { connectOrCreate: { where: { slug: t.slug }, create: { name: t.name, slug: t.slug } } },
  }));
}

/** "That value already exists" = Postgres refused a duplicate in a unique column (Prisma code P2002). */
function isDuplicateError(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "P2002";
}

/** All my posts, drafts AND published (not deleted), last edited first. */
export async function listPosts() {
  const posts = await prisma.post.findMany({ where: notDeleted, select: listSelect, orderBy: { updatedAt: "desc" } });
  return posts.map(withFlatTags);
}

/** One post with everything (for the editor), or null if it doesn't exist or was deleted. */
export async function getPost(id: number) {
  const post = await prisma.post.findFirst({ where: { id, ...notDeleted }, select: postSelect });
  return post ? withFlatTags(post) : null;
}

/** What createPost needs (already checked by the controller). */
export interface NewPost {
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  coverImageUrl?: string | null;
  tags: { name: string; slug: string }[];
}

/**
 * Creates a new post as a DRAFT, with its tags, in ONE statement.
 * Prisma runs this "nested write" as a transaction: the post and all its
 * post_tags rows are saved together, or nothing is saved.
 */
export async function createPost(input: NewPost, authorId: number) {
  try {
    const post = await prisma.post.create({
      data: {
        title: input.title,
        slug: input.slug,
        excerpt: input.excerpt ?? "",
        content: input.content ?? "",
        coverImageUrl: input.coverImageUrl ?? null,
        // status not set → the database default: DRAFT
        authorId,
        tags: { create: tagRows(input.tags) },
      },
      select: postSelect,
    });
    return { kind: "ok" as const, post: withFlatTags(post) };
  } catch (error) {
    if (isDuplicateError(error)) return { kind: "slug-taken" as const };
    throw error; // anything else → error handler → 500
  }
}

/** What updatePost may change (already checked by the controller). Missing = leave as is. */
export interface PostChanges {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  coverImageUrl?: string | null;
  tags?: { name: string; slug: string }[];
}

/** The fields a post must have before it can be public. Returns their messages, or null if complete. */
function missingForPublish(post: { excerpt: string; content: string }): Record<string, string> | null {
  const fields: Record<string, string> = {};
  if (!post.excerpt.trim()) fields.excerpt = "Add an excerpt before publishing.";
  if (!post.content.trim()) fields.content = "Add some content before publishing.";
  return Object.keys(fields).length > 0 ? fields : null;
}

/** The post as it is now (not deleted), with just what the rules below need. */
function findExisting(id: number) {
  return prisma.post.findFirst({
    where: { id, ...notDeleted },
    select: { id: true, slug: true, excerpt: true, content: true, status: true, publishedAt: true },
  });
}

/**
 * EDIT (PATCH): changes ONLY the fields that were sent.
 * Tags sent → the post's tag list is REPLACED: all its post_tags rows are
 * removed, then the new ones are added (in one statement).
 * A published post can't be emptied (its excerpt/content must stay filled).
 */
export async function updatePost(id: number, changes: PostChanges) {
  const existing = await findExisting(id);
  if (!existing) return { kind: "not-found" as const };

  if (existing.status === "PUBLISHED") {
    const missing = missingForPublish({
      excerpt: changes.excerpt ?? existing.excerpt,
      content: changes.content ?? existing.content,
    });
    if (missing) return { kind: "incomplete" as const, fields: missing };
  }

  try {
    const post = await prisma.post.update({
      where: { id },
      data: {
        // `undefined` = "not sent" → Prisma leaves that column unchanged.
        title: changes.title,
        slug: changes.slug,
        excerpt: changes.excerpt,
        content: changes.content,
        coverImageUrl: changes.coverImageUrl,
        tags: changes.tags ? { deleteMany: {}, create: tagRows(changes.tags) } : undefined,
      },
      select: postSelect,
    });
    return { kind: "ok" as const, post: withFlatTags(post) };
  } catch (error) {
    if (isDuplicateError(error)) return { kind: "slug-taken" as const };
    throw error;
  }
}

/**
 * PUBLISH: the post becomes public. Only a finished post (excerpt + content).
 * publishedAt is set the FIRST time only; republishing keeps the original date.
 */
export async function publishPost(id: number) {
  const existing = await findExisting(id);
  if (!existing) return { kind: "not-found" as const };

  const missing = missingForPublish(existing);
  if (missing) return { kind: "incomplete" as const, fields: missing };

  const post = await prisma.post.update({
    where: { id },
    data: { status: "PUBLISHED", publishedAt: existing.publishedAt ?? new Date() },
    select: postSelect,
  });
  return { kind: "ok" as const, post: withFlatTags(post) };
}

/** UNPUBLISH: back to draft (hidden from visitors). publishedAt is kept. */
export async function unpublishPost(id: number) {
  const existing = await findExisting(id);
  if (!existing) return { kind: "not-found" as const };

  const post = await prisma.post.update({ where: { id }, data: { status: "DRAFT" }, select: postSelect });
  return { kind: "ok" as const, post: withFlatTags(post) };
}

/**
 * SOFT DELETE: the row stays, but it's marked deleted and hidden everywhere.
 *  - deletedAt = now     → every query with `notDeleted` skips it
 *  - status = DRAFT      → it can never show up publicly by mistake
 *  - slug gets "-deleted-<id>" → the address is free for a new post
 *    (cut so it still fits the 80-character column)
 */
export async function softDeletePost(id: number) {
  const existing = await findExisting(id);
  if (!existing) return { kind: "not-found" as const };

  const suffix = `-deleted-${id}`;
  await prisma.post.update({
    where: { id },
    data: { deletedAt: new Date(), status: "DRAFT", slug: existing.slug.slice(0, 80 - suffix.length) + suffix },
  });
  return { kind: "ok" as const };
}
