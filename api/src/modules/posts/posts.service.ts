// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: posts.service.ts
// Database layer for the PUBLIC blog (visitors, no login).
// Golden rule, written ONCE in `visible`: only PUBLISHED and not-deleted
// posts ever leave this file. Drafts look exactly like posts that don't exist.
// Flow: routes → controller → service (THIS) → Prisma → Postgres
// ──────────────────────────────────────────────────────────────────────

import type { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../db/prisma.js";

/** THE rule for visitors: published AND not soft-deleted. Used by every query here. */
export const visible = { status: "PUBLISHED", deletedAt: null } satisfies Prisma.PostWhereInput;

/**
 * What visitors get for a post in the LIST: no content (too long for a list),
 * and nothing internal (no id, status, author or deleted_at).
 */
const cardSelect = {
  slug: true,
  title: true,
  excerpt: true,
  coverImageUrl: true,
  publishedAt: true,
  tags: { select: { tag: { select: { name: true, slug: true } } } },
} satisfies Prisma.PostSelect;

/** One full post = the card + its Markdown content + when it was last edited. */
const postSelect = { ...cardSelect, content: true, updatedAt: true } satisfies Prisma.PostSelect;

/** Prisma gives tags as [{ tag: { name, slug } }]; visitors get [{ name, slug }]. */
function withFlatTags<T extends { tags: { tag: { name: string; slug: string } }[] }>(post: T) {
  return { ...post, tags: post.tags.map((row) => row.tag) };
}

/** Rough reading time: about 200 words per minute, at least 1 minute. */
export function readingMinutes(markdown: string): number {
  const words = markdown.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/**
 * One PAGE of published posts, newest first, optionally only those with a tag.
 * Two queries in one transaction: the page itself, and how many there are in total
 * (so the page can show "page 2 of 3").
 *   SELECT … FROM posts WHERE status='PUBLISHED' AND deleted_at IS NULL [AND has tag]
 *   ORDER BY published_at DESC LIMIT $limit OFFSET $offset;   +   SELECT COUNT(*) …
 */
export async function listPublishedPosts(options: { limit: number; offset: number; tag?: string }) {
  const where: Prisma.PostWhereInput = {
    ...visible,
    // "has a post_tags row whose tag has this slug" (many-to-many filter)
    ...(options.tag ? { tags: { some: { tag: { slug: options.tag } } } } : {}),
  };

  const [posts, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      select: cardSelect,
      orderBy: { publishedAt: "desc" },
      skip: options.offset,
      take: options.limit,
    }),
    prisma.post.count({ where }),
  ]);

  return { data: posts.map(withFlatTags), total };
}

/** One published post by its slug, with content + reading time; null for drafts, deleted or unknown. */
export async function getPublishedPost(slug: string) {
  const post = await prisma.post.findFirst({ where: { slug, ...visible }, select: postSelect });
  if (!post) return null;
  return { ...withFlatTags(post), readingMinutes: readingMinutes(post.content) };
}
