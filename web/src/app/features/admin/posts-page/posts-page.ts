// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: posts-page.ts
// /admin/posts: the table of ALL my posts (drafts + published) with row
// actions: Publish / Unpublish, Delete (with an in-page "Are you sure?").
// Reads with httpResource (posts), acts with HttpClient (service methods),
// then reloads the list. Edit + "New post" arrive with the editor (step 6c).
// ──────────────────────────────────────────────────────────────────────

import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminPostsService } from '../admin-posts.service';
import { apiErrorMessage } from '../api-error';
import { AdminPostSummary } from '../post.model';

@Component({
  selector: 'app-posts-page',
  imports: [DatePipe],
  templateUrl: './posts-page.html',
  styleUrl: './posts-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostsPage {
  private readonly postsService = inject(AdminPostsService);

  /** The list, as a resource: posts.value(), posts.isLoading(), posts.error(), posts.reload(). */
  protected readonly posts = this.postsService.loadPosts();
  protected readonly rows = computed(() => this.posts.value()?.data ?? []);

  /** The id of the row whose action is running (its buttons are disabled meanwhile). */
  protected readonly busyId = signal<number | null>(null);
  /** The id of the row that is asking "Delete this post?". */
  protected readonly confirmDeleteId = signal<number | null>(null);
  /** One message above the table: what went wrong, or what just happened. */
  protected readonly notice = signal<{ kind: 'error' | 'ok'; text: string } | null>(null);

  protected togglePublish(post: AdminPostSummary): void {
    const action = post.status === 'PUBLISHED' ? this.postsService.unpublish(post.id) : this.postsService.publish(post.id);
    const done = post.status === 'PUBLISHED' ? 'is back to draft' : 'is published';
    this.run(post, action, `"${post.title}" ${done}.`);
  }

  protected askDelete(post: AdminPostSummary): void {
    this.notice.set(null);
    this.confirmDeleteId.set(post.id);
  }

  protected cancelDelete(): void {
    this.confirmDeleteId.set(null);
  }

  protected confirmDelete(post: AdminPostSummary): void {
    this.confirmDeleteId.set(null);
    this.run(post, this.postsService.delete(post.id), `"${post.title}" was deleted.`);
  }

  /** Runs one row action: lock the row, call the API, then reload the list or show the error. */
  private run(post: AdminPostSummary, action: Observable<unknown>, successText: string): void {
    this.busyId.set(post.id);
    this.notice.set(null);
    action.subscribe({
      next: () => {
        this.busyId.set(null);
        this.notice.set({ kind: 'ok', text: successText });
        this.posts.reload(); // fetch the list again, so the table shows the new state
      },
      error: (error: unknown) => {
        this.busyId.set(null);
        this.notice.set({ kind: 'error', text: apiErrorMessage(error) });
      },
    });
  }
}
