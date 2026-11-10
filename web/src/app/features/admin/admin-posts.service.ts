// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: admin-posts.service.ts
// ONE service for all the admin posts endpoints (/api/admin/posts…).
// Project convention:
//   • READ (data shown on screen)  → httpResource: signals for value, loading, error
//   • ACTIONS (on a click)         → HttpClient: returns an Observable, subscribe once
// Both go through the auth interceptor, so an expired badge is renewed by itself.
// Used by: features/admin pages (posts table now, editor in step 6c).
// ──────────────────────────────────────────────────────────────────────

import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '@core/api/api.config';
import { AdminPost, AdminPostList } from './post.model';

@Injectable({ providedIn: 'root' })
export class AdminPostsService {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/admin/posts`;

  /**
   * GET /api/admin/posts → all my posts (drafts + published), last edited first.
   * Returns a resource: call .reload() on it after an action to fetch the list again.
   * Must be called from an injection context (e.g. a component field), like httpResource itself.
   */
  loadPosts() {
    return httpResource<AdminPostList>(() => this.url);
  }

  /** POST /api/admin/posts/:id/publish → the updated post (400 if excerpt/content are missing). */
  publish(id: number) {
    return this.http.post<AdminPost>(`${this.url}/${id}/publish`, {});
  }

  /** POST /api/admin/posts/:id/unpublish → the updated post (back to draft). */
  unpublish(id: number) {
    return this.http.post<AdminPost>(`${this.url}/${id}/unpublish`, {});
  }

  /** DELETE /api/admin/posts/:id → 204 (soft delete: hidden everywhere, row kept). */
  delete(id: number) {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
