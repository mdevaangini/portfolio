// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: admin-posts.schema.ts
// The RULES for a post's fields, written once with Zod ("the server's
// Validators"). One schema gives us BOTH the check (bad input → a message
// per field → 400) AND the TypeScript type of the clean data.
// No database here. Used by: admin-posts.controller.ts
// ──────────────────────────────────────────────────────────────────────

import { z } from "zod";
import { SLUG_PATTERN, toSlug } from "../../lib/slug.js";

/** Is this text an https:// address? */
function isHttpsUrl(text: string): boolean {
  try {
    return new URL(text).protocol === "https:";
  } catch {
    return false;
  }
}

/** One tag name, e.g. "Angular " → "angular". */
const tagName = z
  .string({ error: "Each tag must be text." })
  .trim()
  .toLowerCase()
  .min(2, { error: "Each tag must be 2–30 characters." })
  .max(30, { error: "Each tag must be 2–30 characters." })
  .refine((name) => toSlug(name, 40).length > 0, { error: "Each tag needs at least one letter or number." });

/**
 * A NEW post. Same limits as the columns in schema.prisma.
 * Fields not listed here (e.g. "status") are simply dropped: a post is always
 * created as a DRAFT, and only publish/unpublish may change that.
 */
export const createPostSchema = z.object({
  title: z
    .string({ error: "Title is required." })
    .trim()
    .min(3, { error: "Title must be 3–150 characters." })
    .max(150, { error: "Title must be 3–150 characters." }),

  /** Optional: when missing, the controller makes one from the title. */
  slug: z
    .string({ error: "Slug must be text." })
    .trim()
    .toLowerCase()
    .min(3, { error: "Slug must be 3–80 characters." })
    .max(80, { error: "Slug must be 3–80 characters." })
    .regex(SLUG_PATTERN, { error: 'Slug may only use lowercase letters, numbers and "-" (e.g. signals-vs-rxjs).' })
    .optional(),

  /** Short summary for the list. Optional while it's a draft. */
  excerpt: z.string({ error: "Excerpt must be text." }).trim().max(300, { error: "Excerpt must be 300 characters or fewer." }).optional(),

  /** The post itself, in Markdown. Optional while it's a draft. */
  content: z.string({ error: "Content must be text." }).max(100_000, { error: "Content must be 100,000 characters or fewer." }).optional(),

  /** Empty or null = no image; otherwise an https:// address. */
  coverImageUrl: z
    .preprocess(
      (value) => (value === "" ? null : value),
      z
        .string({ error: "Cover image must be an https:// address." })
        .trim()
        .max(500, { error: "Cover image address is too long." })
        .refine(isHttpsUrl, { error: "Cover image must be an https:// address." })
        .nullable(),
    )
    .optional(),

  /** Tag names, e.g. ["angular", "signals"]. Duplicates are removed later. */
  tags: z.array(tagName, { error: 'Tags must be a list of names, e.g. ["angular", "signals"].' }).max(8, { error: "At most 8 tags." }).optional(),
});

/** EDITING a post (PATCH, Blog step 4b): the same rules, but every field is optional. */
export const updatePostSchema = createPostSchema.partial();

/** The clean data's TypeScript type, made FROM the schema (they can never disagree). */
export type CreatePostInput = z.infer<typeof createPostSchema>;

/**
 * Runs a schema on a request body and returns either the clean data, or one
 * message per field, e.g. { title: "Title must be 3–150 characters." }:
 * the same shape as the contact form's 400 answer.
 */
export function checkBody<T>(schema: z.ZodType<T>, body: unknown): { ok: true; data: T } | { ok: false; fields: Record<string, string> } {
  const result = schema.safeParse(body ?? {});
  if (result.success) return { ok: true, data: result.data };

  const fields: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const field = String(issue.path[0] ?? "body");
    fields[field] ??= issue.message; // keep the first message per field
  }
  return { ok: false, fields };
}

/** Tag names → [{ name, slug }], with duplicates ("Angular", "angular") kept once. */
export function toTagList(names: string[] = []): { name: string; slug: string }[] {
  const bySlug = new Map<string, { name: string; slug: string }>();
  for (const name of names) bySlug.set(toSlug(name, 40), { name, slug: toSlug(name, 40) });
  return [...bySlug.values()];
}
