import type { Request, Response } from "express";

/**
 * Runs when no route matched the request, e.g. GET /api/unknown.
 * Must be registered AFTER all routes.
 */
export function notFound(req: Request, res: Response) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}
