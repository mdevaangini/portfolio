// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: blog.service.ts
// Talks to the PUBLIC blog endpoints. Read-only, so everything is an
// httpResource (signals: value, isLoading, error), as the project convention says.
// Each method takes a FUNCTION that reads signals: when they change (a new
// tag, a new page, a new slug), the request is sent again by itself.
// Used by: the blog pages (and "Latest posts" on Home, in 7c).
// ──────────────────────────────────────────────────────────────────────

import { httpResource } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '@core/api/api.config';
import { BlogTag, PostPage } from './blog.model';

/** Which page of the list to load. `page` starts at 1. */
export interface PostQuery {
  tag: string | null;
  page: number;
  pageSize: number;
}

@Injectable({ providedIn: 'root' })
export class BlogService {
  private readonly baseUrl = inject(API_BASE_URL);

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

  /** GET /api/tags → the tags used by published posts, A→Z (for the filter chips). */
  loadTags() {
    return httpResource<BlogTag[]>(() => `${this.baseUrl}/tags`);
  }
}
