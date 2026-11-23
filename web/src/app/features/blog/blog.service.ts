// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: blog.service.ts
// Talks to the PUBLIC blog endpoints. Project convention:
//   • READS (posts, tags, reaction counts) → httpResource (signals: value, isLoading, error)
//   • ACTIONS (add / remove a reaction)   → HttpClient (an Observable, on a click)
// Each method takes a FUNCTION that reads signals: when they change (a new
// tag, a new page, a new slug), the request is sent again by itself.
// Used by: the blog pages (and "Latest posts" on Home, in 7c).
// ──────────────────────────────────────────────────────────────────────

import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '@core/api/api.config';
import { BlogPost, BlogTag, PostPage, ReactionName, ReactionSummary } from './blog.model';

/** Which page of the list to load. `page` starts at 1. */
export interface PostQuery {
  tag: string | null;
  page: number;
  pageSize: number;
}

@Injectable({ providedIn: 'root' })
export class BlogService {
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly http = inject(HttpClient);

  /**
   * GET /api/posts?limit=…&offset=…[&tag=…] → one page of published posts, newest first.
   * Page 2 with 10 per page = offset 10 (skip the first 10).
   */
  loadPosts(query: () => PostQuery) {
    return httpResource<PostPage>(() => {
      const { tag, page, pageSize } = query();
      const params: Record<string, string | number> = { limit: pageSize, offset: (page - 1) * pageSize };
      if (tag) params['tag'] = tag;
      return { url: `${this.baseUrl}/posts`, params };
    });
  }

  /**
   * GET /api/posts/:slug → one published post (with its Markdown content and reading time).
   * 404 for unknown slugs AND for drafts / deleted posts: the API never reveals drafts.
   */
  loadPost(slug: () => string) {
    return httpResource<BlogPost>(() => `${this.baseUrl}/posts/${encodeURIComponent(slug())}`);
  }

  /** GET /api/tags → the tags used by published posts, A→Z (for the filter chips). */
  loadTags() {
    return httpResource<BlogTag[]>(() => `${this.baseUrl}/tags`);
  }

  // ── Reactions (Comments milestone C5) ─────────────────────────────
  // The browser sends the anonymous visitor_id cookie by itself: Angular
  // never sees or handles it (same as the login cookies).

  /** GET /api/posts/:slug/reactions → { counts, mine }. A READ: httpResource. */
  loadReactions(slug: () => string) {
    return httpResource<ReactionSummary>(() => this.reactionsUrl(slug()));
  }

  /** PUT …/reactions/like → add mine (doing it twice changes nothing) → the new { counts, mine }. An ACTION: HttpClient. */
  addReaction(slug: string, name: ReactionName) {
    return this.http.put<ReactionSummary>(`${this.reactionsUrl(slug)}/${name}`, {});
  }

  /** DELETE …/reactions/like → remove mine → the new { counts, mine }. */
  removeReaction(slug: string, name: ReactionName) {
    return this.http.delete<ReactionSummary>(`${this.reactionsUrl(slug)}/${name}`);
  }

  private reactionsUrl(slug: string): string {
    return `${this.baseUrl}/posts/${encodeURIComponent(slug)}/reactions`;
  }
}
