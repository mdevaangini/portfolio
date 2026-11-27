// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: comment.model.ts
// TypeScript shapes of the admin COMMENTS API (/api/admin/comments),
// exactly as the API sends them (see docs/18, section 5).
// Used by: admin-comments.service.ts, comments-page, the admin layout badge.
// ──────────────────────────────────────────────────────────────────────

/** In the database: waiting for me / visible / never shown. */
export type CommentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/** The same three as the tabs and the ?status= in the URL (lowercase). */
export type CommentStatusFilter = 'pending' | 'approved' | 'rejected';

/** One comment as I moderate it: who, where, and what it answers. Dates are ISO strings. */
export interface AdminComment {
  id: number;
  authorName: string;
  body: string;
  isAuthor: boolean;
  status: CommentStatus;
  createdAt: string;
  approvedAt: string | null;
  /** Empty = a top-level comment; otherwise the comment it replies to. */
  parentId: number | null;
  post: { id: number; title: string; slug: string };
  parent: { id: number; authorName: string; body: string } | null;
}

/** GET /api/admin/comments?status=… → the list + how many in each status. */
export interface AdminCommentList {
  data: AdminComment[];
  counts: Record<CommentStatusFilter, number>;
}
