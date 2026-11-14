// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: blog-post-page.ts
// /blog/:slug: one published article.
//   • the slug comes from the URL as an input (withComponentInputBinding)
//   • the post is loaded with httpResource (BlogService.loadPost)
//   • three outcomes: the article / "doesn't exist" (404) / "couldn't load"
//   • Markdown → HTML with the shared markdown pipe, styled by .prose
//     (exactly like the editor preview)
//   • the browser tab title + the page description are set from the post
//     (Title and Meta services), and the description is put back on leaving
// ──────────────────────────────────────────────────────────────────────

import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { MarkdownPipe } from '@shared/pipes/markdown.pipe';
import { BlogService } from '../blog.service';

@Component({
  selector: 'app-blog-post-page',
  imports: [DatePipe, RouterLink, MarkdownPipe],
  templateUrl: './blog-post-page.html',
  styleUrl: './blog-post-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogPostPage {
  private readonly titleService = inject(Title);
  private readonly meta = inject(Meta);

  /** From the URL: /blog/signals-vs-rxjs → "signals-vs-rxjs". */
  readonly slug = input.required<string>();

  /** The post. Loads again by itself if the slug changes. */
  protected readonly post = inject(BlogService).loadPost(this.slug);

  /** The post once it's here, else null. (hasValue() first: value() throws on errors.) */
  protected readonly article = computed(() => (this.post.hasValue() ? this.post.value() : null));
  /** 404 = no such published post (unknown, draft or deleted): no "Try again" for this one. */
  protected readonly notFound = computed(() => {
    const error = this.post.error();
    return error instanceof HttpErrorResponse && error.status === 404;
  });
  /** Show "Updated …" only if it was edited on a later day than it was published. */
  protected readonly wasEdited = computed(() => {
    const p = this.article();
    return !!p && new Date(p.updatedAt).toDateString() !== new Date(p.publishedAt).toDateString();
  });

  constructor() {
    // The site-wide description from index.html, to put back when I leave this page.
    const siteDescription = this.meta.getTag('name="description"')?.content ?? '';

    // When the post arrives: the tab title and the description become the post's.
    effect(() => {
      const p = this.article();
      if (p) {
        this.titleService.setTitle(`${p.title} · Devaangini Mehta`);
        this.meta.updateTag({ name: 'description', content: p.excerpt || siteDescription });
      } else if (this.notFound()) {
        this.titleService.setTitle('Post not found · Devaangini Mehta');
      }
    });

    // Leaving the article: other pages get the site's own description back.
    // (Their titles are set by their routes.)
    inject(DestroyRef).onDestroy(() => this.meta.updateTag({ name: 'description', content: siteDescription }));
  }
}
