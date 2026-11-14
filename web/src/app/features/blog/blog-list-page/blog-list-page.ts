// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: blog-list-page.ts
// /blog: my published posts, newest first, 10 per page, filterable by tag.
// THE URL IS THE SOURCE OF TRUTH: /blog?tag=angular&page=2
//   • the router hands ?tag and ?page to this page as inputs
//     (withComponentInputBinding in app.config.ts)
//   • the posts resource reads them → a new URL = a new request, by itself
//   • tag chips and Newer/Older are LINKS that only change the URL
// So reload, Back and shared links all show the same list.
// ──────────────────────────────────────────────────────────────────────

import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BlogService } from '../blog.service';

@Component({
  selector: 'app-blog-list-page',
  imports: [DatePipe, RouterLink],
  templateUrl: './blog-list-page.html',
  styleUrl: './blog-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogListPage {
  private readonly blog = inject(BlogService);

  /** From the URL (?tag=angular). URL values always arrive as text, or undefined. */
  readonly tag = input<string>();
  /** From the URL (?page=2). */
  readonly page = input<string>();

  protected readonly pageSize = 10;

  /** The tag filter, or null for "All". */
  protected readonly selectedTag = computed(() => this.tag() || null);
  /** ?page as a number; anything odd (missing, "abc", 0, -1) means page 1. */
  protected readonly currentPage = computed(() => {
    const n = Number(this.page());
    return Number.isInteger(n) && n >= 1 ? n : 1;
  });

  /** One page of posts. Re-loads by itself whenever the tag or page changes. */
  protected readonly posts = this.blog.loadPosts(() => ({
    tag: this.selectedTag(),
    page: this.currentPage(),
    pageSize: this.pageSize,
  }));
  protected readonly tags = this.blog.loadTags();

  /** The loaded page, or null (still loading, or failed). Check hasValue() first: value() throws on errors. */
  private readonly loaded = computed(() => (this.posts.hasValue() ? this.posts.value() : null));
  protected readonly cards = computed(() => this.loaded()?.data ?? []);
  protected readonly total = computed(() => this.loaded()?.total ?? 0);
  protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize)));
  /** Only the very first load shows skeletons; later loads just dim the old list. */
  protected readonly firstLoad = computed(() => this.posts.isLoading() && !this.posts.hasValue());

  /** URL values for a page link. Page 1 and "All" are left out → a clean /blog. */
  protected pageParams(page: number) {
    return { tag: this.selectedTag(), page: page > 1 ? page : null };
  }
}
