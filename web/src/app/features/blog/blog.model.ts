// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: blog.model.ts
// TypeScript shapes of what the PUBLIC blog API sends (GET /api/posts,
// /api/posts/:slug, /api/tags). Only published posts ever arrive here.
// ──────────────────────────────────────────────────────────────────────

/** A tag: shown as "Angular", used in addresses as "angular". */
export interface BlogTag {
  name: string;
  slug: string;
}

/** One post in the LIST (no content: too long for a list). */
export interface PostCard {
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl: string | null;
  /** ISO date, e.g. "2026-11-14T10:00:00.000Z" */
  publishedAt: string;
  tags: BlogTag[];
}

/** One page of the list: GET /api/posts?limit=10&offset=0&tag=angular */
export interface PostPage {
  data: PostCard[];
  /** How many posts match in total (for "Page 2 of 3"). */
  total: number;
  limit: number;
  offset: number;
}

/** One full post: GET /api/posts/:slug */
export interface BlogPost extends PostCard {
  /** The post itself, in Markdown. */
  content: string;
  updatedAt: string;
  readingMinutes: number;
}
