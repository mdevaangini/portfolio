// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: admin-comments.service.ts
// ONE service for the admin comments endpoints (/api/admin/comments…).
// Project convention:
//   • READ (the list shown on screen) → httpResource
//   • ACTIONS (approve, reject, reply, delete) → HttpClient
// It also holds `pendingCount`, a signal SHARED by the admin top bar
// (the badge) and the comments page: the page updates it, the badge follows.
// Used by: comments-page, admin-layout.
// ──────────────────────────────────────────────────────────────────────

import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, Signal, inject, signal } from '@angular/core';
import { API_BASE_URL } from '@core/api/api.config';
import { AdminComment, AdminCommentList, CommentStatusFilter } from './comment.model';

@Injectable({ providedIn: 'root' })
export class AdminCommentsService {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/admin/comments`;

  /** How many comments wait for review: the badge in the top bar. null = not known yet. */
  readonly pendingCount = signal<number | null>(null);

  /**
   * GET /api/admin/comments?status=… → the list (newest first) + counts.
   * Reacts to the `status` signal: switching tabs loads the other list by itself.
   */
  loadComments(status: Signal<CommentStatusFilter>) {
    return httpResource<AdminCommentList>(() => ({ url: this.url, params: { status: status() } }));
  }

  /** Asks only for the counts' sake (the badge), e.g. when the admin area opens. Errors are ignored: it's a hint. */
  refreshPendingCount(): void {
    this.http.get<AdminCommentList>(this.url, { params: { status: 'pending' } }).subscribe({
      next: (list) => this.pendingCount.set(list.counts.pending),
      error: () => {},
    });
  }

  /** POST /:id/approve → the comment, now visible. */
  approve(id: number) {
    return this.http.post<AdminComment>(`${this.url}/${id}/approve`, {});
  }

  /** POST /:id/reject → the comment, never shown. */
  reject(id: number) {
    return this.http.post<AdminComment>(`${this.url}/${id}/reject`, {});
  }

  /** POST /:id/reply → my reply as the author (approved at once; a pending comment I answer is approved too). */
  reply(id: number, body: string) {
    return this.http.post<AdminComment>(`${this.url}/${id}/reply`, { body });
  }

  /** DELETE /:id → 204 (soft delete; its replies disappear with it). */
  delete(id: number) {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
