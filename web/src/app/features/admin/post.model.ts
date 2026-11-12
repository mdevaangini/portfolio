// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: post.model.ts
// TypeScript shapes of the admin posts API (/api/admin/posts), exactly as
// the API sends them (see docs/14-backend-api-handbook.md, section 3.4).
// Used by: admin-posts.service.ts and the admin pages.
// ──────────────────────────────────────────────────────────────────────

/** A post is a draft (only I see it) or published (everyone sees it). */
export type PostStatus = 'DRAFT' | 'PUBLISHED';

export interface PostTag {
  name: string;
  slug: string;
}

/** One post in the admin LIST (everything except the long `content`). Dates are ISO strings. */
export interface AdminPostSummary {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string | null;
  status: PostStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  tags: PostTag[];
}

/** One full post (for the editor, step 6c): the summary + its Markdown content. */
export interface AdminPost extends AdminPostSummary {
  content: string;
}

/** GET /api/admin/posts → { data: [...] } */
export interface AdminPostList {
  data: AdminPostSummary[];
}

/**
 * What the editor sends to create (POST) or change (PATCH) a post.
 * PATCH sends only the fields that changed. Tags are plain names: ["angular", "signals"].
 */
export interface PostInput {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  coverImageUrl?: string | null;
  tags?: string[];
}
