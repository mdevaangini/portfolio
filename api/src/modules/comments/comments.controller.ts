// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: comments.controller.ts
// HTTP layer for comments on a PUBLIC post (no login).
//   GET  /api/posts/:slug/comments → the approved comments + their replies
//   POST /api/posts/:slug/comments → a new comment or reply → PENDING (202)
// A new comment passes 6 checks, cheapest first (see `create`).
// A draft or unknown post → the same 404 as the article.
// Flow: routes → controller (THIS) → service → Prisma → Postgres
// ──────────────────────────────────────────────────────────────────────

import type { Request, Response } from "express";
import { SLUG_PATTERN } from "../../lib/slug.js";
import { checkBody } from "../../lib/validation.js";
import { ensureVisitorId } from "../../lib/visitor-id.js";
import { findVisiblePostId } from "../posts/posts.service.js";
import { createCommentSchema } from "./comments.schema.js";
import { canReplyTo, countRecentComments, createComment, listApprovedComments } from "./comments.service.js";

/** At most 3 comments per browser per 10 minutes, and 30 per post per hour. */
const RATE_LIMIT = { perVisitor: 3, visitorMinutes: 10, perPost: 30, postMinutes: 60 };

/** The same answer for a real comment AND for a bot caught by the honeypot. */
const ACCEPTED = { status: "PENDING", message: "Thanks! Your comment will appear after review." };

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000);

/** The published post's id for :slug, or answers 404 itself and returns null. */
async function postIdOr404(req: Request, res: Response): Promise<number | null> {
  const slug = String(req.params.slug);
  const postId = SLUG_PATTERN.test(slug) ? await findVisiblePostId(slug) : null;
  if (postId === null) res.status(404).json({ error: "Post not found." });
  return postId;
}

/**
 * GET /api/posts/:slug/comments
 * → 200 { data: [ { id, authorName, isAuthor, body, createdAt, replies: [ … ] } ], total }
 * total = comments + replies (for "3 comments" on the page).
 */
export async function list(req: Request, res: Response) {
  const postId = await postIdOr404(req, res);
  if (postId === null) return;

  const data = await listApprovedComments(postId);
  const total = data.reduce((sum, comment) => sum + 1 + comment.replies.length, 0);
  res.status(200).json({ data, total });
}

/**
 * POST /api/posts/:slug/comments
 * Body (JSON): { authorName, body, parentId?, website }  (website = the hidden honeypot)
 * → 202 { status: "PENDING", message }   (accepted, not visible until I approve it)
 */
export async function create(req: Request, res: Response) {
  const body = req.body ?? {};

  // 1. Spam trap: "website" is a hidden field people never see. Bots fill every field.
  //    Filled → pretend it worked, save nothing (the bot learns nothing).
  if (typeof body.website === "string" && body.website.trim() !== "") {
    res.status(202).json(ACCEPTED);
    return;
  }

  // 2. The rules for each field (Zod). All problems are reported at once.
  const check = checkBody(createCommentSchema, body);
  if (!check.ok) {
    res.status(400).json({ error: "Please check your comment.", fields: check.fields });
    return;
  }
  const { authorName, body: text, parentId } = check.data;

  // 3. Only published posts can be commented on.
  const postId = await postIdOr404(req, res);
  if (postId === null) return;

  // 4. A reply must answer an approved, TOP-LEVEL comment of this same post.
  if (parentId && !(await canReplyTo(postId, parentId))) {
    res.status(400).json({
      error: "You can only reply to a comment on this post.",
      fields: { parentId: "This comment can't be replied to." },
    });
    return;
  }

  // 5. Rate limits, counted in the database (works across serverless copies).
  const visitorId = ensureVisitorId(req, res);
  const recent = await countRecentComments({
    postId,
    visitorId,
    visitorSince: minutesAgo(RATE_LIMIT.visitorMinutes),
    postSince: minutesAgo(RATE_LIMIT.postMinutes),
  });
  if (recent.byVisitor >= RATE_LIMIT.perVisitor || recent.byPost >= RATE_LIMIT.perPost) {
    res.status(429).json({ error: "Too many comments right now. Please try again a little later." });
    return;
  }

  // 6. Save it as PENDING. 202 = "accepted", not "visible yet".
  await createComment({ postId, parentId: parentId ?? null, authorName, body: text, visitorId });
  res.status(202).json(ACCEPTED);
}
