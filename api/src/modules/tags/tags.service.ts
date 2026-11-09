// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: tags.service.ts
// Database layer for the public tag list: only tags that are used by at
// least one VISIBLE post (published + not deleted), for the blog's filter chips.
// Flow: routes → controller → service (THIS) → Prisma → Postgres
// ──────────────────────────────────────────────────────────────────────

import { prisma } from "../../db/prisma.js";
import { visible } from "../posts/posts.service.js";

/**
 * Tags with at least one visible post, A→Z.
 * "some post_tags row whose post is visible" (many-to-many filter, read through post_tags).
 */
export function listTagsInUse() {
  return prisma.tag.findMany({
    where: { posts: { some: { post: visible } } },
    select: { name: true, slug: true },
    orderBy: { name: "asc" },
  });
}
