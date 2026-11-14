// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: post-editor-page.ts
// ONE page to write a new post (/admin/posts/new) or edit one (/admin/posts/5).
//   • loads the post (httpResource) and fills the form
//   • live Markdown preview as you type (MarkdownPipe, shared)
//   • Save: new → POST (then go to its address); existing → PATCH only the changed fields
//   • API field errors (400 / 409) appear under the matching field
//   • leaving with unsaved changes asks first (unsavedChangesGuard + beforeunload)
// ──────────────────────────────────────────────────────────────────────

import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MarkdownPipe } from '@shared/pipes/markdown.pipe';
import { AdminPostsService } from '../admin-posts.service';
import { apiErrorMessage } from '../api-error';
import { AdminPost, PostInput, PostStatus } from '../post.model';
import { HasUnsavedChanges } from '../unsaved-changes.guard';

type FieldName = 'title' | 'slug' | 'excerpt' | 'tags' | 'coverImageUrl' | 'content';

/** Same rule as the API: lowercase letters/digits in groups joined by "-". */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** "Signals vs RxJS!" → "signals-vs-rxjs": a preview of the slug the API will make from the title. */
function toSlug(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '');
}

@Component({
  selector: 'app-post-editor-page',
  imports: [ReactiveFormsModule, RouterLink, MarkdownPipe],
  templateUrl: './post-editor-page.html',
  styleUrl: './post-editor-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Closing or reloading the tab with unsaved changes → the browser's own "Leave site?" question.
  host: { '(window:beforeunload)': 'onBeforeUnload($event)' },
})
export class PostEditorPage implements HasUnsavedChanges {
  private readonly postsService = inject(AdminPostsService);
  private readonly router = inject(Router);

  /** Same limits as the API (Zod) and the database columns. */
  protected readonly max = { title: 150, slug: 80, excerpt: 300, coverImageUrl: 500, content: 100_000 };

  /** null = a NEW post (/admin/posts/new); a number = editing that post. */
  protected readonly postId = signal<number | null>(this.readId());
  protected readonly isNew = computed(() => this.postId() === null);

  /** The post from the API (nothing is loaded for a new post). */
  protected readonly post = this.postsService.loadPost(this.postId);
  /** Draft / Published, shown next to the title (from the last load or save). */
  protected readonly status = signal<PostStatus | null>(null);

  protected readonly form = inject(NonNullableFormBuilder).group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(this.max.title)]],
    slug: ['', [Validators.maxLength(this.max.slug), Validators.pattern(SLUG_PATTERN)]],
    excerpt: ['', [Validators.maxLength(this.max.excerpt)]],
    tags: [''], // typed as "angular, signals"; turned into ["angular", "signals"] when saving
    coverImageUrl: ['', [Validators.maxLength(this.max.coverImageUrl), Validators.pattern(/^https:\/\/\S+$/)]],
    content: ['', [Validators.maxLength(this.max.content)]],
  });

  /** Live values for the preview (signals made from the form's valueChanges). */
  protected readonly content = toSignal(this.form.controls.content.valueChanges, { initialValue: '' });
  protected readonly title = toSignal(this.form.controls.title.valueChanges, { initialValue: '' });
  protected readonly excerptText = toSignal(this.form.controls.excerpt.valueChanges, { initialValue: '' });
  /** The slug the API will make if the slug field is left empty. */
  protected readonly suggestedSlug = computed(() => toSlug(this.title()));

  protected readonly saving = signal(false);
  protected readonly notice = signal<{ kind: 'error' | 'ok'; text: string } | null>(null);
  /** Field messages from the API (400 / 409), shown under the matching field. */
  protected readonly serverErrors = signal<Partial<Record<FieldName, string>>>({});

  constructor() {
    // A message passed along when we arrive here right after creating the post.
    const passed = this.router.currentNavigation()?.extras.state?.['notice'];
    if (typeof passed === 'string') this.notice.set({ kind: 'ok', text: passed });

    // When the post arrives from the API, put it into the form (once per load).
    effect(() => {
      // hasValue() first: value() throws if loading failed (e.g. 404).
      if (!this.post.hasValue()) return;
      const loaded = this.post.value();
      if (loaded) untracked(() => this.fill(loaded));
    });

    // Typing in a field clears the API's old message for it.
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      if (Object.keys(this.serverErrors()).length > 0) this.serverErrors.set({});
    });
  }

  /** Message under a field: the API's message first, then the form's own checks (once touched). */
  protected errorFor(field: FieldName): string {
    const fromServer = this.serverErrors()[field];
    if (fromServer) return fromServer;

    const control = this.form.controls[field];
    if (!control.touched || !control.errors) return '';
    if (control.errors['required']) return 'Please enter a title.';
    if (control.errors['minlength']) return 'Title must be 3–150 characters.';
    if (control.errors['maxlength']) return `Too long (max ${control.errors['maxlength'].requiredLength} characters).`;
    if (control.errors['pattern']) {
      return field === 'slug'
        ? 'Lowercase letters, numbers and "-" only (e.g. signals-vs-rxjs).'
        : 'Must be an https:// address.';
    }
    return '';
  }

  /** Save: create a new post, or send only the changed fields of an existing one. */
  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const id = this.postId();
    if (id === null) return this.create();

    const changes = this.changedFields();
    if (Object.keys(changes).length === 0) {
      this.notice.set({ kind: 'ok', text: 'Nothing to save: no changes.' });
      return;
    }

    this.startSaving();
    this.postsService.update(id, changes).subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.fill(saved);
        this.notice.set({ kind: 'ok', text: 'Saved.' });
      },
      error: (error: unknown) => this.showError(error),
    });
  }

  /** For the guard: leaving now would lose work. */
  hasUnsavedChanges(): boolean {
    return this.form.dirty && !this.saving();
  }

  protected onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) event.preventDefault();
  }

  // ── helpers ────────────────────────────────────────────────────────

  private create(): void {
    const v = this.form.getRawValue();
    const body: PostInput = {
      title: v.title,
      excerpt: v.excerpt,
      content: v.content,
      coverImageUrl: v.coverImageUrl.trim() || null,
      tags: this.tagList(v.tags),
      // An empty slug is left out, so the API makes one from the title.
      ...(v.slug.trim() ? { slug: v.slug.trim() } : {}),
    };

    this.startSaving();
    this.postsService.create(body).subscribe({
      next: (created) => {
        this.saving.set(false);
        this.form.markAsPristine(); // nothing unsaved any more → the guard lets us move on
        void this.router.navigate(['/admin/posts', created.id], {
          replaceUrl: true, // Back won't return to an empty "new post" form
          state: { notice: 'Draft created. Publish it from the posts list when it’s ready.' },
        });
      },
      error: (error: unknown) => this.showError(error),
    });
  }

  /** Only the fields I changed since the last load/save (PATCH sends nothing else). */
  private changedFields(): PostInput {
    const c = this.form.controls;
    const changes: PostInput = {};
    if (c.title.dirty) changes.title = c.title.value;
    if (c.slug.dirty && c.slug.value.trim()) changes.slug = c.slug.value.trim();
    if (c.excerpt.dirty) changes.excerpt = c.excerpt.value;
    if (c.content.dirty) changes.content = c.content.value;
    if (c.coverImageUrl.dirty) changes.coverImageUrl = c.coverImageUrl.value.trim() || null;
    if (c.tags.dirty) changes.tags = this.tagList(c.tags.value);
    return changes;
  }

  /** "Angular,  signals ," → ["Angular", "signals"] (the API lowercases and removes duplicates). */
  private tagList(text: string): string[] {
    return text
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  /** Puts a post from the API into the form, as the new "unchanged" state. */
  private fill(post: AdminPost): void {
    this.form.reset({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      tags: post.tags.map((tag) => tag.name).join(', '),
      coverImageUrl: post.coverImageUrl ?? '',
      content: post.content,
    });
    this.status.set(post.status);
  }

  private startSaving(): void {
    this.saving.set(true);
    this.notice.set(null);
    this.serverErrors.set({});
  }

  /** 400 / 409 → messages under the fields + a summary; anything else → a summary only. */
  private showError(error: unknown): void {
    this.saving.set(false);
    if (error instanceof HttpErrorResponse && (error.status === 400 || error.status === 409)) {
      const fields = (error.error as { fields?: Partial<Record<FieldName, string>> } | null)?.fields;
      if (fields) this.serverErrors.set(fields);
    }
    this.notice.set({ kind: 'error', text: apiErrorMessage(error) });
  }

  /** The :id from the address, or null on /admin/posts/new. */
  private readId(): number | null {
    const id = inject(ActivatedRoute).snapshot.paramMap.get('id');
    return id === null ? null : Number(id);
  }
}
