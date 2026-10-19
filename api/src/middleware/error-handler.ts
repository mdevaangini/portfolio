import type { NextFunction, Request, Response } from "express";

/**
 * Catches any error thrown in a controller or service, including a failed
 * database query. Express recognises an error handler by its 4 parameters,
 * so all four must stay, even though `next` is unused.
 *
 * The full error is logged on the server for us to debug; the client only
 * gets a generic message, so internal details (SQL, file paths) never leak.
 */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  console.error(`[error] ${req.method} ${req.originalUrl}`, err);
  res.status(500).json({ error: "Something went wrong. Please try again later." });
}
