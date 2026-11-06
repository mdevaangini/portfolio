// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: admin-posts.service.ts
// Database layer for MY posts (admin only): list all (drafts too), get one,
// create one with its tags. The ONLY place in this feature that talks to Postgres.
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
