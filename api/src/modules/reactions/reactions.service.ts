// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: reactions.service.ts
// Database layer for reactions (👍 like · ❤️ love · 💡 insightful).
// Only PUBLISHED, not-deleted posts can be found here (the same `visible`
// rule as the public blog), so drafts can't get reactions.
// "One per browser per type" is guaranteed by the DATABASE:
// @@unique([postId, visitorId, type]) in schema.prisma.
// Flow: routes → controller → service (THIS) → Prisma → Postgres
// ──────────────────────────────────────────────────────────────────────

import type { ReactionType } from "../../../generated/prisma/client.js";
import { prisma } from "../../db/prisma.js";
import { visible } from "../posts/posts.service.js";

/** The reaction names used in URLs and JSON (lowercase), in display order. */
export const REACTION_NAMES = ["like", "love", "insightful"] as const;
export type ReactionName = (typeof REACTION_NAMES)[number];

/** "like" ↔ LIKE: lowercase in the API, uppercase in the database enum. */
const toType = (name: ReactionName) => name.toUpperCase() as ReactionType;
const toName = (type: ReactionType) => type.toLowerCase() as ReactionName;

/** The id of a PUBLISHED post with this slug, or null (draft, deleted or unknown). */
export async function findVisiblePostId(slug: string): Promise<number | null> {
  const post = await prisma.post.findFirst({ where: { slug, ...visible }, select: { id: true } });
  return post?.id ?? null;
}

/**
 * The counts for a post, and which reactions THIS browser has given.
 *   SELECT type, COUNT(*) FROM reactions WHERE post_id = $1 GROUP BY type;
 *   SELECT type FROM reactions WHERE post_id = $1 AND visitor_id = $2;
 * → { counts: { like: 4, love: 1, insightful: 0 }, mine: ["like"] }
 */
export async function getReactionSummary(postId: number, visitorId: string | null) {
  const [groups, mine] = await Promise.all([
    prisma.reaction.groupBy({ by: ["type"], where: { postId }, _count: { _all: true } }),
    visitorId ? prisma.reaction.findMany({ where: { postId, visitorId }, select: { type: true } }) : Promise.resolve([]),
  ]);

  // Start every count at 0, so a reaction nobody gave still appears.
  const counts: Record<ReactionName, number> = { like: 0, love: 0, insightful: 0 };
  for (const group of groups) counts[toName(group.type)] = group._count._all;

  return { counts, mine: mine.map((row) => toName(row.type)) };
}

/**
 * ADD my reaction. Doing it twice changes nothing (idempotent).
 * skipDuplicates = Postgres "INSERT … ON CONFLICT DO NOTHING": if this browser
 * already gave this reaction (the unique rule), the database just skips it,
 * even when two clicks arrive at the same moment.
 */
export async function addReaction(postId: number, visitorId: string, name: ReactionName): Promise<void> {
  await prisma.reaction.createMany({ data: [{ postId, visitorId, type: toType(name) }], skipDuplicates: true });
}

/** REMOVE my reaction. If it isn't there, nothing happens (idempotent too). */
export async function removeReaction(postId: number, visitorId: string, name: ReactionName): Promise<void> {
  await prisma.reaction.deleteMany({ where: { postId, visitorId, type: toType(name) } });
}
