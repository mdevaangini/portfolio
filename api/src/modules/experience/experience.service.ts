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
