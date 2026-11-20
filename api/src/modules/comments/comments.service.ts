// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: comments.service.ts
// Database layer for PUBLIC comments (visitors).
//   • reading: only APPROVED, not-deleted comments, with their approved replies
//   • writing: a new comment is always PENDING (I approve it in the admin, C4)
//   • the reply rule: a parent must be on the same post, approved and TOP-LEVEL
//   • counting for rate limits
// Flow: routes → controller → service (THIS) → Prisma → Postgres
// ──────────────────────────────────────────────────────────────────────

import { prisma } from "../../db/prisma.js";

/** What visitors may see of a comment: no visitor id, no status, nothing internal. */
const publicFields = { id: true, authorName: true, isAuthor: true, body: true, createdAt: true } as const;

/** "Shown on the site": approved and not deleted. */
const shown = { status: "APPROVED", deletedAt: null } as const;

/** Safety cap: a blog post won't get this many; paging can come later. */
const MAX_COMMENTS = 200;

/**
 * The approved comments of a post, OLDEST first (a conversation reads top to bottom),
 * each with its approved replies, also oldest first.
 *   SELECT … FROM comments WHERE post_id = $1 AND parent_id IS NULL AND status = 'APPROVED'
 *     AND deleted_at IS NULL ORDER BY created_at   (+ the same for their replies)
 * A reply whose parent is hidden is hidden too (it would make no sense alone).
 */
export function listApprovedComments(postId: number) {
  return prisma.comment.findMany({
    where: { postId, parentId: null, ...shown },
    orderBy: { createdAt: "asc" },
    take: MAX_COMMENTS,
    select: {
      ...publicFields,
      replies: { where: shown, orderBy: { createdAt: "asc" }, select: publicFields },
    },
  });
}

/**
 * Can a reply be attached to this comment? Only if it's on THE SAME post,
 * APPROVED, not deleted and TOP-LEVEL (parentId empty): one level of replies only.
 */
export async function canReplyTo(postId: number, parentId: number): Promise<boolean> {
  const parent = await prisma.comment.findFirst({
    where: { id: parentId, postId, parentId: null, ...shown },
    select: { id: true },
  });
  return parent !== null;
}

/** How many comments this browser sent recently, and how many this post got recently. */
export async function countRecentComments(options: {
  postId: number;
  visitorId: string;
  visitorSince: Date;
  postSince: Date;
}) {
  const [byVisitor, byPost] = await prisma.$transaction([
    prisma.comment.count({ where: { visitorId: options.visitorId, createdAt: { gte: options.visitorSince } } }),
    prisma.comment.count({ where: { postId: options.postId, createdAt: { gte: options.postSince } } }),
  ]);
  return { byVisitor, byPost };
}

/** Saves a visitor's comment or reply. status is left to the database default: PENDING. */
export function createComment(data: {
  postId: number;
  parentId: number | null;
  authorName: string;
  body: string;
  visitorId: string;
}) {
  return prisma.comment.create({ data, select: { id: true, status: true } });
}
