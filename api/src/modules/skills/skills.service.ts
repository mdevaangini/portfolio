import { prisma } from "../../db/prisma.js";

/**
 * Database work for the Skills section.
 */

/**
 * All skill groups in display order, each WITH its own list of skills.
 *
 * `select` picks which fields to send back (like choosing columns).
 * Asking for `skills` inside it is the "together with" part: Prisma uses the
 * group_id link to fetch each group's skills, and nests them in the result:
 *   [{ id: 1, name: "Frontend", isCore: true, skills: [{ id: 1, name: "Angular (15+)" }, …] }, …]
 */
export function findSkillGroups() {
  return prisma.skillGroup.findMany({
    orderBy: { displayOrder: "asc" },
    select: {
      id: true,
      name: true,
      isCore: true,
      skills: {
        orderBy: { displayOrder: "asc" },
        select: { id: true, name: true },
      },
    },
  });
}
