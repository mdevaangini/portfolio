// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: experience.controller.ts
// HTTP layer for experience: reads the request, checks it,
// calls the service, and decides the status code + JSON reply. Never touches the database.
// Flow: routes → controller (THIS) → service → Prisma → Postgres
// ──────────────────────────────────────────────────────────────────────

import type { Request, Response } from "express";
import { findExperiences } from "./experience.service.js";

/** GET /api/experience — no query values to read or check, so it's short. */
export async function listExperiences(_req: Request, res: Response) {
  const experiences = await findExperiences();
  res.json(experiences);
}
