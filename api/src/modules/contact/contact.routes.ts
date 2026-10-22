// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: contact.routes.ts
// URL map for the contact feature (mounted at /api/contact).
// Says which URL + method (GET/POST) calls which controller function.
// Flow: routes (THIS) → controller → service → Prisma → Postgres
// ──────────────────────────────────────────────────────────────────────

import { Router } from "express";
import { sendMessage } from "./contact.controller.js";

/** URL map for the contact feature, mounted at "/api/contact". */
export const contactRouter = Router();

contactRouter.post("/", sendMessage); // POST /api/contact  (post, not get: it SENDS data)
