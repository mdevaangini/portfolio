import type { Prisma, Project } from "../../../generated/prisma/client.js";
import { prisma } from "../../db/prisma.js";

/**
 * Data access for projects. The only place that talks to the database
 * about projects. Knows nothing about HTTP (no req/res here).
 */

/** What the controller asks for: already checked, so the service can trust it */
export interface ProjectListQuery {
  limit: number; // how many projects to return at most
  offset: number; // how many to skip first
  title?: string; // optional: only titles containing this text
  category?: string; // optional: only projects in this category, e.g. "Payments"
}

/** One page of projects, plus the total so the frontend can show page numbers */
export interface ProjectList {
  data: Project[];
  total: number;
  limit: number;
  offset: number;
}

export async function findProjects({ limit, offset, title, category }: ProjectListQuery): Promise<ProjectList> {
  // The filter, built from whichever values were given (none given = no filter):
  // - title:    "title contains this text", ignoring upper/lower case
  // - category: "category is exactly this", ignoring upper/lower case
  const where: Prisma.ProjectWhereInput = {
    ...(title && { title: { contains: title, mode: "insensitive" } }),
    ...(category && { category: { equals: category, mode: "insensitive" } }),
  };

  // Two questions to the database, asked together:
  // 1. "give me this page of projects"   2. "how many match in total?"
  const [data, total] = await prisma.$transaction([
    prisma.project.findMany({
      where,
      orderBy: { displayOrder: "asc" },
      take: limit, // = LIMIT
      skip: offset, // = OFFSET
    }),
    prisma.project.count({ where }),
  ]);

  return { data, total, limit, offset };
}

/** One project by its id, or null when no project has that id */
export async function findProjectById(id: number): Promise<Project | null> {
  // Same as: SELECT * FROM projects WHERE id = ... LIMIT 1
  return prisma.project.findUnique({ where: { id } });
}

/** The list of categories in use, e.g. ["Banking", "Lending", "Payments"]. Feeds the chips. */
export async function findCategories(): Promise<string[]> {
  // Same as: SELECT DISTINCT category FROM projects WHERE category IS NOT NULL ORDER BY category
  const rows = await prisma.project.findMany({
    where: { category: { not: null } },
    distinct: ["category"],
    select: { category: true },
    orderBy: { category: "asc" },
  });
  return rows.map((row) => row.category as string);
}

// Brief flow, now with Prisma

// When the server starts:

// .env → config/env.ts → db/prisma.ts creates Prisma (once) → app.ts → server.ts listens

// On every request from Angular:

// Angular → cors → /api → /projects → controller → service
//         → Prisma (writes the SQL) → PostgreSQL → rows
//         → service → controller → JSON → Angular
