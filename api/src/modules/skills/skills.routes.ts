// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: skills.routes.ts
// URL map for the skills feature (mounted at /api/skills).
// Says which URL + method (GET/POST) calls which controller function.
// Flow: routes (THIS) → controller → service → Prisma → Postgres
// ──────────────────────────────────────────────────────────────────────

import { Router } from "express";
import { listSkillGroups } from "./skills.controller.js";

/** URL map for the skills feature, mounted at "/api/skills". */
export const skillsRouter = Router();

skillsRouter.get("/", listSkillGroups); // GET /api/skills
