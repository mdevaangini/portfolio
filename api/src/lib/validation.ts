// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: validation.ts
// One helper used by every feature that checks input with Zod:
// runs a schema and returns either the clean data, or ONE message per
// field, e.g. { title: "Title must be 3–150 characters." }: the same shape
// as the contact form's 400 answer.
// Used by: admin-posts (request body) and posts (query: ?limit&offset&tag).
// ──────────────────────────────────────────────────────────────────────

import type { z } from "zod";

export function checkBody<T>(schema: z.ZodType<T>, input: unknown): { ok: true; data: T } | { ok: false; fields: Record<string, string> } {
  const result = schema.safeParse(input ?? {});
  if (result.success) return { ok: true, data: result.data };

  const fields: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const field = String(issue.path[0] ?? "body");
    fields[field] ??= issue.message; // keep the first message per field
  }
  return { ok: false, fields };
}
