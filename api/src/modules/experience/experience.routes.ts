// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: experience.routes.ts
// URL map for the experience feature (mounted at /api/experience).
// Says which URL + method (GET/POST) calls which controller function.
// Flow: routes (THIS) → controller → service → Prisma → Postgres
// ──────────────────────────────────────────────────────────────────────

import { Router } from "express";
import { listExperiences } from "./experience.controller.js";

/** URL map for the experience feature, mounted at "/api/experience". */
export const experienceRouter = Router();

experienceRouter.get("/", listExperiences); // GET /api/experience
