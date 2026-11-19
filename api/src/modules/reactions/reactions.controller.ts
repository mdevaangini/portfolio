// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: reactions.controller.ts
// HTTP layer for reactions on a PUBLIC post (no login).
//   GET    /api/posts/:slug/reactions        → counts + which ones I gave
//   PUT    /api/posts/:slug/reactions/like   → make sure MY 👍 is there
//   DELETE /api/posts/:slug/reactions/like   → make sure MY 👍 is gone
// "Me" = the anonymous visitor_id cookie (lib/visitor-id.ts).
// Checks before the database: the reaction name (400) and the slug's
// format (404). A draft or unknown post → the same 404 as the article.
// Flow: routes → controller (THIS) → service → Prisma → Postgres
// ──────────────────────────────────────────────────────────────────────

import type { Request, Response } from "express";
import { SLUG_PATTERN } from "../../lib/slug.js";
import { ensureVisitorId, readVisitorId } from "../../lib/visitor-id.js";
import {
  REACTION_NAMES,
  type ReactionName,
  addReaction,
  findVisiblePostId,
  getReactionSummary,
  removeReaction,
} from "./reactions.service.js";

/** :type from the URL, if it's one of our three names. */
function readReactionName(req: Request): ReactionName | null {
  const value = String(req.params.type);
  return (REACTION_NAMES as readonly string[]).includes(value) ? (value as ReactionName) : null;
}

/** The published post's id for :slug, or answers 404 itself and returns null. */
async function postIdOr404(req: Request, res: Response): Promise<number | null> {
  const slug = String(req.params.slug);
  const postId = SLUG_PATTERN.test(slug) ? await findVisiblePostId(slug) : null;
  if (postId === null) res.status(404).json({ error: "Post not found." });
  return postId;
}

function unknownReaction(res: Response) {
  res.status(400).json({ error: `Unknown reaction. Use one of: ${REACTION_NAMES.join(", ")}.` });
}

/** GET /api/posts/:slug/reactions → 200 { counts, mine }. Never sets a cookie (only reading). */
export async function getReactions(req: Request, res: Response) {
  const postId = await postIdOr404(req, res);
  if (postId === null) return;
  res.status(200).json(await getReactionSummary(postId, readVisitorId(req)));
}

/** PUT /api/posts/:slug/reactions/:type → 200 { counts, mine } (gives this browser an id if needed). */
export async function addOne(req: Request, res: Response) {
  const name = readReactionName(req);
  if (!name) return unknownReaction(res);
  const postId = await postIdOr404(req, res);
  if (postId === null) return;

  const visitorId = ensureVisitorId(req, res);
  await addReaction(postId, visitorId, name);
  res.status(200).json(await getReactionSummary(postId, visitorId));
}

/** DELETE /api/posts/:slug/reactions/:type → 200 { counts, mine }. No id yet = nothing to remove. */
export async function removeOne(req: Request, res: Response) {
  const name = readReactionName(req);
  if (!name) return unknownReaction(res);
  const postId = await postIdOr404(req, res);
  if (postId === null) return;

  const visitorId = readVisitorId(req);
  if (visitorId) await removeReaction(postId, visitorId, name);
  res.status(200).json(await getReactionSummary(postId, visitorId));
}
