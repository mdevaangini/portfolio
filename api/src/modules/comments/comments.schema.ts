// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: comments.schema.ts
// The RULES for a new comment, written once with Zod. Same limits as the
// columns in schema.prisma (author_name 50, body 2000).
// Plain text only: the text is stored as typed and always SHOWN as text
// (Angular escapes {{ }}), never as HTML, so nothing in it can run as code.
// Fields not listed (e.g. "status", "isAuthor") are dropped: a visitor
// can't approve their own comment or pretend to be the author.
// Used by: comments.controller.ts
// ──────────────────────────────────────────────────────────────────────

import { z } from "zod";

export const createCommentSchema = z.object({
  authorName: z
    .string({ error: "Please enter your name." })
    .trim()
    .min(2, { error: "Name must be 2–50 characters." })
    .max(50, { error: "Name must be 2–50 characters." }),

  body: z
    .string({ error: "Please write a comment." })
    .trim()
    .min(2, { error: "Comment must be 2–2000 characters." })
    .max(2000, { error: "Comment must be 2000 characters or fewer." }),

  /** Only for a REPLY: the id of the top-level comment it answers. Empty/null = a new comment. */
  parentId: z
    .number({ error: "parentId must be a number." })
    .int({ error: "parentId must be a whole number." })
    .positive({ error: "parentId must be a positive number." })
    .nullable()
    .optional(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
