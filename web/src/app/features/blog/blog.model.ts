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

/** The three reactions (lowercase, as in the API's URLs and JSON). */
export type ReactionName = 'like' | 'love' | 'insightful';

/** GET/PUT/DELETE /api/posts/:slug/reactions… → how many of each, and which ones THIS browser gave. */
export interface ReactionSummary {
  /** e.g. { like: 4, love: 1, insightful: 0 } */
  counts: Record<ReactionName, number>;
  /** e.g. ["like"]: known from the browser's anonymous visitor_id cookie */
  mine: ReactionName[];
}

/** One shown comment or reply (only APPROVED ones ever arrive). Plain text: always shown as text. */
export interface CommentReply {
  id: number;
  authorName: string;
  /** true = written by me, the author: shown with an "Author" badge. */
  isAuthor: boolean;
  body: string;
  createdAt: string;
}

/** A top-level comment with its replies (one level only), oldest first. */
export interface BlogComment extends CommentReply {
  replies: CommentReply[];
}

/** GET /api/posts/:slug/comments */
export interface CommentList {
  data: BlogComment[];
  /** comments + replies, for "3 comments" */
  total: number;
}

/** POST /api/posts/:slug/comments: what the form sends. */
export interface NewComment {
  authorName: string;
  body: string;
  /** Only for a reply: the TOP-LEVEL comment it belongs to. */
  parentId?: number;
  /** The hidden spam trap: always empty from real people. */
  website: string;
}

/** 202: accepted, but not visible until I approve it. */
export interface CommentAccepted {
  status: 'PENDING';
  message: string;
}
