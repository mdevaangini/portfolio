// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: app.ts
// Builds the Express app: the steps EVERY request passes through, in order:
// CORS → turn JSON body into req.body → /api routes → 404 → error handler.
// ──────────────────────────────────────────────────────────────────────

import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFound } from "./middleware/not-found.js";
import { apiRouter } from "./routes.js";

/**
 * Builds the Express app. It does NOT start the server, so it can also be used in tests.
 *
 * Order matters: Express runs these top to bottom for every request.
 */
export const app = express();

// 1. Before routes: prepare the request
app.use(cors({ origin: env.corsOrigin })); // allow the Angular app to read responses
app.use(express.json()); // turn a JSON request body into req.body (needed for POST later)

// 2. The routes: every feature lives under /api
app.use("/api", apiRouter);

// 3. After routes: only reached when nothing above sent a response
app.use(notFound); // no route matched → 404
app.use(errorHandler); // something threw → 500

// Vercel looks for a file like src/app.ts with a *default* export and turns this
// app into one serverless function. Locally, server.ts imports the named `app` above.
export default app;
