// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: comments-page.ts
// /admin/comments?status=pending : my REVIEW QUEUE (and the approved /
// rejected lists). Each comment: its post, who, when, the text, what it
// replies to, and buttons: Approve · Reject · Reply · Delete.
//   • the tab lives in the URL (?status=…), like the blog's tag filter
//     → Reload and Back keep it (withComponentInputBinding)
//   • actions: lock the row (busyId) → API → notice → reload the list
//   • Delete asks first in the shared dialog
//   • every new list updates the badge count in the top bar
// ──────────────────────────────────────────────────────────────────────

import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DialogService } from '@shared/ui/dialog/dialog.service';
import { Observable } from 'rxjs';
import { AdminCommentsService } from '../admin-comments.service';
import { apiErrorMessage } from '../api-error';
import { AdminComment, CommentStatusFilter } from '../comment.model';

const TABS: { status: CommentStatusFilter; label: string }[] = [
  { status: 'pending', label: 'Pending' },
  { status: 'approved', label: 'Approved' },
  { status: 'rejected', label: 'Rejected' },
];

@Component({
  selector: 'app-comments-page',
  imports: [DatePipe, RouterLink, ReactiveFormsModule],
  templateUrl: './comments-page.html',
  styleUrl: './comments-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentsPage {
  private readonly commentsService = inject(AdminCommentsService);
  private readonly dialog = inject(DialogService);

  /** From the URL: /admin/comments?status=approved. Anything else → pending. */
  readonly status = input<string>();
  protected readonly current = computed<CommentStatusFilter>(() => {
    const value = this.status();
    return value === 'approved' || value === 'rejected' ? value : 'pending';
  });

  protected readonly tabs = TABS;

  /** The list for the current tab (reloads by itself when the tab changes). */
  protected readonly comments = this.commentsService.loadComments(this.current);
  protected readonly rows = computed(() => (this.comments.hasValue() ? this.comments.value().data : []));
  protected readonly counts = computed(() => (this.comments.hasValue() ? this.comments.value().counts : null));

  /** The comment whose action is running (its buttons are disabled meanwhile). */
  protected readonly busyId = signal<number | null>(null);
  /** One message above the list: what happened, or what went wrong. */
  protected readonly notice = signal<{ kind: 'ok' | 'error'; text: string } | null>(null);

  /** The comment I'm writing a reply to (one at a time), and the reply's text. */
  protected readonly replyingTo = signal<number | null>(null);
  protected readonly replyText = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(2), Validators.maxLength(2000)],
  });

  constructor() {
    // Every fresh list brings fresh counts → the badge in the top bar follows.
    effect(() => {
      const counts = this.counts();
      if (counts) this.commentsService.pendingCount.set(counts.pending);
    });
  }

  protected approve(comment: AdminComment): void {
    this.run(comment, this.commentsService.approve(comment.id), `${comment.authorName}'s comment is now visible.`);
  }

  protected reject(comment: AdminComment): void {
    this.run(comment, this.commentsService.reject(comment.id), `${comment.authorName}'s comment was rejected.`);
  }

  /** Asks first (shared dialog); only a "Delete" click calls the API. */
  protected async remove(comment: AdminComment): Promise<void> {
    const ok = await this.dialog.confirm({
      title: 'Delete this comment?',
      message: `${comment.authorName}'s comment (and any replies to it) will disappear from "${comment.post.title}".`,
      confirmText: 'Delete',
      danger: true,
    });
    if (ok) this.run(comment, this.commentsService.delete(comment.id), 'The comment was deleted.');
  }

  protected openReply(comment: AdminComment): void {
    this.replyingTo.set(comment.id);
    this.replyText.reset('');
  }

  protected cancelReply(): void {
    this.replyingTo.set(null);
  }

  protected sendReply(comment: AdminComment): void {
    if (this.replyText.invalid) {
      this.replyText.markAsTouched();
      return;
    }
    const done =
      comment.status === 'PENDING'
        ? `Your reply is published, and ${comment.authorName}'s comment was approved with it.`
        : 'Your reply is published.';
    this.run(comment, this.commentsService.reply(comment.id, this.replyText.value.trim()), done, () => this.replyingTo.set(null));
  }

  /** Runs one action: lock the row, call the API, then reload the list or show the error. */
  private run(comment: AdminComment, action: Observable<unknown>, successText: string, onSuccess?: () => void): void {
    this.busyId.set(comment.id);
    this.notice.set(null);
    action.subscribe({
      next: () => {
        this.busyId.set(null);
        this.notice.set({ kind: 'ok', text: successText });
        onSuccess?.();
        this.comments.reload(); // fresh list + fresh counts (→ the badge)
      },
      error: (error: unknown) => {
        this.busyId.set(null);
        this.notice.set({ kind: 'error', text: apiErrorMessage(error) });
      },
    });
  }
}
