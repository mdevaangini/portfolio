// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: experience.service.ts
// Database layer for experience: the Prisma calls (read all jobs, newest first).
// The ONLY place in this feature that talks to Postgres.
// Flow: routes → controller → service (THIS) → Prisma → Postgres
// ──────────────────────────────────────────────────────────────────────

import { prisma } from "../../db/prisma.js";

/**
 * Database work for the Experience section.
 * Only this file talks to Prisma; the controller just calls these functions.
 */

/** All jobs, newest first. */
export function findExperiences() {
  return prisma.experience.findMany({
    orderBy: { startDate: "desc" },
  });
}
