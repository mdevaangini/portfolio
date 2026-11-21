// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: admin-comments.controller.ts
// HTTP layer for MODERATION (admin only). Runs only AFTER requireAdmin
// and checkOrigin said yes (they stand in front of all of /api/admin).
//   GET    /api/admin/comments?status=pending   → list + counts
//   POST   /api/admin/comments/:id/approve      → visible on the post
//   POST   /api/admin/comments/:id/reject       → never shown
//   DELETE /api/admin/comments/:id              → soft delete (204)
//   POST   /api/admin/comments/:id/reply        → my reply as the author (201)
// Flow: routes → requireAdmin → controller (THIS) → service → Prisma
// ──────────────────────────────────────────────────────────────────────

import type { Request, Response } from "express";
import type { CommentStatus } from "../../../generated/prisma/client.js";
import { checkBody } from "../../lib/validation.js";
import { listQuerySchema, replySchema } from "./admin-comments.schema.js";
import { listComments, replyAsAuthor, setCommentStatus, softDeleteComment } from "./admin-comments.service.js";

/** The :id from the URL as a positive whole number, or null. */
function readId(req: Request): number | null {
  const id = Number(req.params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

const badId = (res: Response) => res.status(400).json({ error: "id must be a positive whole number" });
const notFound = (res: Response) => res.status(404).json({ error: "Comment not found." });

/** GET /api/admin/comments?status=pending → 200 { data: [...], counts: { pending, approved, rejected } } */
export async function list(req: Request, res: Response) {
  const check = checkBody(listQuerySchema, req.query);
  if (!check.ok) {
    res.status(400).json({ error: "Please check the address.", fields: check.fields });
    return;
  }
  const status = check.data.status.toUpperCase() as CommentStatus;
  res.status(200).json(await listComments(status));
}

/** Shared by approve and reject. */
async function moderate(req: Request, res: Response, status: "APPROVED" | "REJECTED") {
  const id = readId(req);
  if (id === null) return badId(res);

  const result = await setCommentStatus(id, status);
  if (result.kind === "not-found") return notFound(res);
  res.status(200).json(result.comment);
}

/** POST /api/admin/comments/:id/approve → 200 + the comment */
export const approve = (req: Request, res: Response) => moderate(req, res, "APPROVED");

/** POST /api/admin/comments/:id/reject → 200 + the comment */
export const reject = (req: Request, res: Response) => moderate(req, res, "REJECTED");

/** DELETE /api/admin/comments/:id → 204 (soft delete; its replies disappear with it) */
export async function remove(req: Request, res: Response) {
  const id = readId(req);
  if (id === null) return badId(res);

  const result = await softDeleteComment(id);
  if (result.kind === "not-found") return notFound(res);
  res.status(204).end();
}

/** POST /api/admin/comments/:id/reply  Body: { body } → 201 + my reply */
export async function reply(req: Request, res: Response) {
  const id = readId(req);
  if (id === null) return badId(res);

  const check = checkBody(replySchema, req.body ?? {});
  if (!check.ok) {
    res.status(400).json({ error: "Please check your reply.", fields: check.fields });
    return;
  }

  const result = await replyAsAuthor(id, check.data.body);
  if (result.kind === "not-found") return notFound(res);
  if (result.kind === "rejected") {
    res.status(400).json({ error: "This comment was rejected. Approve it first if you want to reply." });
    return;
  }
  res.status(201).json(result.reply);
}
