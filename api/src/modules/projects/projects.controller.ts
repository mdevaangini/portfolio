import type { Request, Response } from "express";
import { findCategories, findProjectById, findProjects } from "./projects.service.js";

/**
 * HTTP handlers for projects. Reads the request, calls the service,
 * and decides what to send back. Never talks to the database directly.
 */

/** GET /api/projects?limit=10&offset=0&title=pay&category=Payments */
export async function listProjects(req: Request, res: Response) {
  // 1. Read the values from the URL. They always arrive as text, so convert them.
  //    If one is missing, use a sensible default.
  const limit = Number(req.query.limit ?? 10);
  const offset = Number(req.query.offset ?? 0);
  const title = typeof req.query.title === "string" ? req.query.title.trim() : "";
  const category = typeof req.query.category === "string" ? req.query.category.trim() : "";

  // 2. Check them. Anyone can type any URL, so never trust these values.
  //    A bad value gets a 400 ("your request is wrong") and we stop here.
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    res.status(400).json({ error: "limit must be a whole number between 1 and 50" });
    return;
  }
  if (!Number.isInteger(offset) || offset < 0) {
    res.status(400).json({ error: "offset must be a whole number of 0 or more" });
    return;
  }

  // 3. Values are safe: ask the service, then send what it returns
  const result = await findProjects({
    limit,
    offset,
    title: title || undefined,
    category: category || undefined,
  });
  res.json(result);
}

/** GET /api/projects/:id   e.g. /api/projects/3 */
export async function getProject(req: Request, res: Response) {
  // 1. Read the id from the URL path. Like everything in a URL, it arrives as text.
  const id = Number(req.params.id);

  // 2. Check it: /api/projects/abc is a wrong request → 400
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: "id must be a positive whole number" });
    return;
  }

  // 3. Ask the service for that one project
  const project = await findProjectById(id);

  // 4. A correct request for a project that doesn't exist → 404 ("not found")
  if (!project) {
    res.status(404).json({ error: `Project ${id} not found` });
    return;
  }

  res.json(project);
}

/** GET /api/projects/categories */
export async function listCategories(req: Request, res: Response) {
  const categories = await findCategories();
  res.json(categories);
}
