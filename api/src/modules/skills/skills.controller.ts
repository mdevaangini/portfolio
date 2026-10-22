// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: skills.controller.ts
// HTTP layer for skills: reads the request, checks it,
// calls the service, and decides the status code + JSON reply. Never touches the database.
// Flow: routes → controller (THIS) → service → Prisma → Postgres
// ──────────────────────────────────────────────────────────────────────

import type { Request, Response } from "express";
import { findSkillGroups } from "./skills.service.js";

/** GET /api/skills */
export async function listSkillGroups(_req: Request, res: Response) {
  const groups = await findSkillGroups();
  res.json(groups);
}
