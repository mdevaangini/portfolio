// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: admin-comments.service.ts
// Database layer for MODERATION (admin only): the review queue, approve,
// reject, soft delete, and my replies as the author.
// Deleted comments are never shown or changed again.
// Flow: routes → controller → service (THIS) → Prisma → Postgres
// ──────────────────────────────────────────────────────────────────────

import type { CommentStatus } from "../../../generated/prisma/client.js";
import { prisma } from "../../db/prisma.js";

/** The name on my replies (shown with the "Author" badge). */
const AUTHOR_NAME = "Devaangini Mehta";

const notDeleted = { deletedAt: null } as const;

/** What I need to moderate a comment: the text, who, where, and what it replies to. */
const moderationFields = {
  id: true,
  authorName: true,
  body: true,
  isAuthor: true,
  status: true,
  createdAt: true,
  approvedAt: true,
  parentId: true,
  post: { select: { id: true, title: true, slug: true } },
  parent: { select: { id: true, authorName: true, body: true } },
} as const;

/**
 * One list (newest first) + how many comments are in each status
 * (counts.pending = the badge in the admin top bar).
 */
export async function listComments(status: CommentStatus) {
  const [data, groups] = await Promise.all([
    prisma.comment.findMany({
      where: { status, ...notDeleted },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: moderationFields,
    }),
    prisma.comment.groupBy({ by: ["status"], where: notDeleted, _count: { _all: true } }),
  ]);

  const counts = { pending: 0, approved: 0, rejected: 0 };
  for (const group of groups) counts[group.status.toLowerCase() as keyof typeof counts] = group._count._all;
  return { data, counts };
}

/** APPROVE or REJECT a comment. approvedAt is set when it's approved. */
export async function setCommentStatus(id: number, status: "APPROVED" | "REJECTED") {
  const existing = await prisma.comment.findFirst({ where: { id, ...notDeleted }, select: { id: true } });
  if (!existing) return { kind: "not-found" as const };

  const comment = await prisma.comment.update({
    where: { id },
    data: { status, approvedAt: status === "APPROVED" ? new Date() : null },
    select: moderationFields,
  });
  return { kind: "ok" as const, comment };
}

/** SOFT DELETE: hidden everywhere from now on. Its replies disappear with it (they're shown only through it). */
export async function softDeleteComment(id: number) {
  const { count } = await prisma.comment.updateMany({ where: { id, ...notDeleted }, data: { deletedAt: new Date() } });
  return count === 1 ? { kind: "ok" as const } : { kind: "not-found" as const };
}

/**
 * MY REPLY as the author: approved immediately, marked isAuthor.
 *  • replying to a REPLY → my answer goes under its top-level comment (one level only)
 *  • replying to a PENDING comment → that comment is approved too ("replying = accepting it")
 *  • replying to a REJECTED comment → refused
 * Both writes happen in ONE transaction: all or nothing.
 */
export async function replyAsAuthor(commentId: number, body: string) {
  const target = await prisma.comment.findFirst({
    where: { id: commentId, ...notDeleted },
    select: { id: true, postId: true, parentId: true, status: true },
  });
  if (!target) return { kind: "not-found" as const };

  // The comment that will hold my reply: the target itself, or its top-level parent.
  const topLevelId = target.parentId ?? target.id;
  const topLevel = await prisma.comment.findFirst({
    where: { id: topLevelId, ...notDeleted },
    select: { id: true, status: true },
  });
  if (!topLevel || topLevel.status === "REJECTED" || target.status === "REJECTED") {
    return { kind: "rejected" as const };
  }

  const now = new Date();
  const [reply] = await prisma.$transaction([
    prisma.comment.create({
      data: {
        postId: target.postId,
        parentId: topLevel.id,
        authorName: AUTHOR_NAME,
        body,
        isAuthor: true,
        status: "APPROVED",
        approvedAt: now,
      },
      select: moderationFields,
    }),
    // Replying to someone means accepting their comment: approve whatever I replied to.
    prisma.comment.updateMany({
      where: { id: { in: [topLevel.id, target.id] }, status: "PENDING" },
      data: { status: "APPROVED", approvedAt: now },
    }),
  ]);
  return { kind: "ok" as const, reply };
}
