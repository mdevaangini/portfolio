// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: slug.ts
// Turns text into a "slug": the readable part of an address.
//   "Signals vs RxJS: when I use which!"  →  "signals-vs-rxjs-when-i-use-which"
// Used for post addresses (/blog/<slug>) and tag addresses (?tag=<slug>).
// ──────────────────────────────────────────────────────────────────────

/** A valid slug: lowercase letters/digits in groups joined by single "-". e.g. "signals-vs-rxjs" */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Text → slug, step by step:
 *  1. "Café Ñ" → "Cafe N"   (remove accents)
 *  2. → lowercase
 *  3. anything that isn't a-z or 0-9 becomes "-"   ("rxjs: when" → "rxjs--when")
 *  4. several "-" in a row become one, and none at the start or end
 *  5. cut to `maxLength` characters (without leaving a "-" at the end)
 */
export function toSlug(text: string, maxLength = 80): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // the accent marks split off by NFKD
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/, "");
}

/**
 * Every blog post needs its own web address, so visitors can open it, share it, or find it on Google. The slug is the last part of that address:

          devaangini-portfolio.vercel.app/blog/signals-vs-rxjs
                                              └──── slug ────┘

A title can’t be used directly in an address, because it has spaces, capitals and symbols (Signals vs RxJS: when I use which!). So slug.ts cleans the title up:

Title	                                           Slug
Signals vs RxJS: when I use which!	            signals-vs-rxjs-when-i-use-which
OnPush & the 60% speed-up	                      onpush-the-60-speed-up
Café Ñandú	                                    cafe-nandu


Its rules: lowercase only, spaces and symbols become -, and accents are removed.

Why not just use the id (/blog/3)? A readable address is nicer to share, tells people what the post is about before they click, and helps Google. That’s why most blogs use slugs.

Two more things:

Every slug must be unique, because two posts can’t share one address. That’s why you get a 409 if it’s already taken.
If you type your own slug when creating a post, that one is used instead of the one made from the title.
 */
