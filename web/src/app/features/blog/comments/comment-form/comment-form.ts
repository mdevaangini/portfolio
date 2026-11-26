// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: comment-form.ts
// ONE reusable form for a new comment AND for a reply (name, comment,
// the hidden "website" spam trap, Send). Used by comments-section:
//   • at the bottom of the comments → a new comment (no parentId)
//   • under a comment after "Reply" → a reply (parentId = that thread)
// After sending (202) the form is replaced by "Thanks! … after review":
// nothing appears on the page until I approve it in the admin.
// The API's 400 messages go under the matching field; 429 → a notice.
// The name is remembered in this browser (a convenience only).
// ──────────────────────────────────────────────────────────────────────

import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BlogService } from '../../blog.service';

type FieldName = 'authorName' | 'body';

/** Where the visitor's name is remembered in this browser. */
const NAME_KEY = 'blog.commentName';

/** localStorage can be blocked (private mode, settings): never let that break the form. */
function readSavedName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
}
function saveName(name: string): void {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    /* not important */
  }
}

/** Gives every form on the page its own ids (the bottom form and a reply form can both be open). */
let nextFormId = 0;

@Component({
  selector: 'app-comment-form',
  imports: [ReactiveFormsModule],
  templateUrl: './comment-form.html',
  styleUrl: './comment-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentForm {
  private readonly blog = inject(BlogService);

  /** Which post. */
  readonly slug = input.required<string>();
  /** For a reply: the top-level comment's id (the thread). null = a new comment. */
  readonly parentId = input<number | null>(null);
  /** For a reply: whose comment I'm answering ("Replying to Asha"). */
  readonly replyTo = input<string | null>(null);
  /** The reply form's "Cancel" / "Close" was clicked. */
  readonly closed = output<void>();

  protected readonly uid = `comment-form-${nextFormId++}`;
  protected readonly max = { authorName: 50, body: 2000 };

  /** Same rules as the API's Zod schema (quick feedback; the API's check is the one that counts). */
  protected readonly form = inject(NonNullableFormBuilder).group({
    authorName: [readSavedName(), [Validators.required, Validators.minLength(2), Validators.maxLength(this.max.authorName)]],
    body: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(this.max.body)]],
    website: [''], // the hidden spam trap: real people never see it
  });

  protected readonly sending = signal(false);
  /** true after a 202: the form is replaced by the thank-you message. */
  protected readonly sent = signal(false);
  /** Field messages from the API (400), shown under the matching field. */
  protected readonly serverErrors = signal<Partial<Record<FieldName, string>>>({});
  /** One message above the button (429, network…). */
  protected readonly notice = signal('');

  /** Message under a field: the API's first, then the form's own checks (once touched). */
  protected errorFor(field: FieldName): string {
    const fromServer = this.serverErrors()[field];
    if (fromServer) return fromServer;
    const control = this.form.controls[field];
    if (!control.touched || !control.errors) return '';
    if (control.errors['required']) return field === 'authorName' ? 'Please enter your name.' : 'Please write a comment.';
    if (control.errors['minlength']) return 'Please write at least 2 characters.';
    if (control.errors['maxlength']) return `Too long (max ${control.errors['maxlength'].requiredLength} characters).`;
    return '';
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { authorName, body, website } = this.form.getRawValue();
    const parentId = this.parentId();

    this.sending.set(true);
    this.serverErrors.set({});
    this.notice.set('');

    this.blog
      .addComment(this.slug(), { authorName, body, website, ...(parentId ? { parentId } : {}) })
      .subscribe({
        next: () => {
          saveName(authorName.trim());
          this.sending.set(false);
          this.sent.set(true);
          this.form.controls.body.reset(''); // keep the name for next time
        },
        error: (error: unknown) => this.showError(error),
      });
  }

  /** "Write another one": show the form again (only for the bottom form). */
  protected writeAnother(): void {
    this.sent.set(false);
  }

  private showError(error: unknown): void {
    this.sending.set(false);
    if (error instanceof HttpErrorResponse) {
      const fields = (error.error as { fields?: Partial<Record<FieldName, string>> } | null)?.fields;
      if (error.status === 400 && fields) {
        this.serverErrors.set(fields);
        return;
      }
      if (error.status === 429) {
        this.notice.set("You've sent several comments in a short time. Please try again in a few minutes.");
        return;
      }
      if (error.status === 0) {
        this.notice.set("Can't reach the server. Please check your connection and try again.");
        return;
      }
    }
    this.notice.set("Your comment couldn't be sent. Please try again.");
  }
}
