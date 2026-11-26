// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: comments-section.ts
// Everything under the article about comments:
//   • the heading with the count ("3 comments")
//   • the list: approved comments, OLDEST first, each with its replies
//     (one level), "Author" badge on mine
//   • "Reply" → a comment-form opens under that THREAD
//   • the main comment-form at the bottom
// "Reply" on a REPLY opens the form for the same thread ("Replying to
// Ravi"), because the API allows only one level of replies.
// New comments are PENDING: they appear only after I approve them, so
// the list is NOT reloaded after sending.
// Used by: blog-post-page (after the reaction bar).
// ──────────────────────────────────────────────────────────────────────

import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { BlogService } from '../../blog.service';
import { CommentForm } from '../comment-form/comment-form';

/** Which thread the reply form is open under, and whose comment it answers. */
interface ReplyTarget {
  threadId: number;
  name: string;
}

@Component({
  selector: 'app-comments-section',
  imports: [DatePipe, CommentForm],
  templateUrl: './comments-section.html',
  styleUrl: './comments-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentsSection {
  /** Which post: the article page passes its slug. */
  readonly slug = input.required<string>();

  /** The approved comments (reloads by itself if the slug changes). */
  protected readonly comments = inject(BlogService).loadComments(this.slug);

  /** The list, or [] while loading / after an error (hasValue() first: value() throws on errors). */
  protected readonly list = computed(() => (this.comments.hasValue() ? this.comments.value().data : []));
  protected readonly total = computed(() => (this.comments.hasValue() ? this.comments.value().total : 0));

  /** The open reply form, or null (only one at a time). */
  protected readonly replyingTo = signal<ReplyTarget | null>(null);

  /** "Reply" under a comment or under one of its replies: always the comment's THREAD. */
  protected startReply(threadId: number, name: string): void {
    this.replyingTo.set({ threadId, name });
  }

  protected closeReply(): void {
    this.replyingTo.set(null);
  }
}
