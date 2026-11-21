// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: admin-comments.schema.ts
// The rules (Zod) for the admin's comment endpoints: which list to show
// (?status=…) and my reply's text. Used by: admin-comments.controller.ts
// ──────────────────────────────────────────────────────────────────────

import { z } from "zod";

/** ?status=pending|approved|rejected (lowercase in the URL). Missing → pending (the review queue). */
export const listQuerySchema = z.object({
  status: z
    .enum(["pending", "approved", "rejected"], { error: "status must be pending, approved or rejected." })
    .default("pending"),
});

/** My reply as the author: the same text limits as a visitor's comment. */
export const replySchema = z.object({
  body: z
    .string({ error: "Please write a reply." })
    .trim()
    .min(2, { error: "Reply must be 2–2000 characters." })
    .max(2000, { error: "Reply must be 2000 characters or fewer." }),
});
