// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: tags.controller.ts
// HTTP layer for the public tag list. Nothing to check: no input.
// Flow: routes → controller (THIS) → service → Prisma → Postgres
// ──────────────────────────────────────────────────────────────────────

import type { Request, Response } from "express";
import { listTagsInUse } from "./tags.service.js";

/** GET /api/tags → 200 [{ name, slug }, …] (only tags on published posts) */
export async function list(_req: Request, res: Response) {
  res.status(200).json(await listTagsInUse());
}
