// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: latest-posts.ts
// "05 · Latest writing" on the HOME page: my 3 newest published posts.
// It lives in features/blog (it knows about posts); Home only PLACES it,
// inside @defer, so its code + API call start only when you scroll near it.
// It's a teaser: with 0 posts, or if the API fails, it shows NOTHING
// (Home never shows an empty or broken block for it).
// Same service + endpoint as the blog list: GET /api/posts?limit=3&offset=0
// ──────────────────────────────────────────────────────────────────────

import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SectionHeading } from '@shared/ui/section-heading/section-heading';
import { BlogService } from '../blog.service';

@Component({
  selector: 'app-latest-posts',
  imports: [DatePipe, RouterLink, SectionHeading],
  templateUrl: './latest-posts.html',
  styleUrl: './latest-posts.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LatestPosts {
  /** Page 1 with 3 posts, no tag: the 3 newest. */
  private readonly posts = inject(BlogService).loadPosts(() => ({ tag: null, page: 1, pageSize: 3 }));

  /** The cards, or [] while loading / after an error (hasValue() first: value() throws on errors). */
  protected readonly cards = computed(() => (this.posts.hasValue() ? this.posts.value().data : []));
}
