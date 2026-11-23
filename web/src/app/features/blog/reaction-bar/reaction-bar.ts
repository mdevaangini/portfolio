// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: reaction-bar.ts
// 👍 ❤️ 💡 under an article: the counts, my reactions highlighted, and a
// click adds / removes mine.
//
// OPTIMISTIC UPDATE: a click changes the screen IMMEDIATELY (as if the
// server had already said yes), then sends the request:
//   • the server answers → show ITS numbers (the truth)
//   • the request fails  → undo only that reaction + a short message
// `summary` is a linkedSignal: it FOLLOWS the server data (the resource)
// AND can be changed by hand for the optimistic step.
// If the reactions can't be loaded, the bar shows nothing (it's a bonus).
// Used by: blog-post-page (after the article text).
// ──────────────────────────────────────────────────────────────────────

import { ChangeDetectionStrategy, Component, inject, input, linkedSignal, signal } from '@angular/core';
import { ReactionName, ReactionSummary } from '../blog.model';
import { BlogService } from '../blog.service';

interface ReactionOption {
  name: ReactionName;
  emoji: string;
  label: string;
}

/** The three buttons, in display order. */
const OPTIONS: ReactionOption[] = [
  { name: 'like', emoji: '👍', label: 'Like' },
  { name: 'love', emoji: '❤️', label: 'Love' },
  { name: 'insightful', emoji: '💡', label: 'Insightful' },
];

/**
 * The summary after adding (add = true) or removing one reaction, as a NEW object
 * (never changing the old one: signals compare by reference, and the old one
 * may still be needed). Counts never go below 0.
 */
export function applyReaction(summary: ReactionSummary, name: ReactionName, add: boolean): ReactionSummary {
  const isMine = summary.mine.includes(name);
  if (add === isMine) return summary; // already in that state: nothing to change
  return {
    counts: { ...summary.counts, [name]: Math.max(0, summary.counts[name] + (add ? 1 : -1)) },
    mine: add ? [...summary.mine, name] : summary.mine.filter((n) => n !== name),
  };
}

@Component({
  selector: 'app-reaction-bar',
  templateUrl: './reaction-bar.html',
  styleUrl: './reaction-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReactionBar {
  private readonly blog = inject(BlogService);

  /** Which post: the article page passes its slug. */
  readonly slug = input.required<string>();

  protected readonly options = OPTIONS;

  /** The server's data: GET /api/posts/:slug/reactions (reloads by itself if the slug changes). */
  private readonly reactions = this.blog.loadReactions(this.slug);

  /**
   * What's ON SCREEN. linkedSignal = it FOLLOWS the resource (new server data →
   * it updates), but I can also .set() it myself (the optimistic step).
   * null = not loaded (yet, or it failed): the bar shows nothing.
   */
  protected readonly summary = linkedSignal<ReactionSummary | null>(() =>
    this.reactions.hasValue() ? this.reactions.value() : null,
  );

  /** Reactions whose request is still running: more clicks on them are ignored (no double requests). */
  protected readonly pending = signal<ReadonlySet<ReactionName>>(new Set());

  /** A short message when saving failed. */
  protected readonly error = signal('');

  protected isMine(name: ReactionName): boolean {
    return this.summary()?.mine.includes(name) ?? false;
  }

  /** Click: mine → remove it, not mine → add it. */
  protected toggle(name: ReactionName): void {
    const before = this.summary();
    if (!before || this.pending().has(name)) return;

    const add = !before.mine.includes(name);

    // 1. OPTIMISTIC: change the screen now, before the server answers.
    this.summary.set(applyReaction(before, name, add));
    this.error.set('');
    this.setPending(name, true);

    // 2. Ask the server.
    const request = add ? this.blog.addReaction(this.slug(), name) : this.blog.removeReaction(this.slug(), name);
    request.subscribe({
      // 3a. Success: the server's numbers are the truth (other visitors may have reacted too).
      next: (fromServer) => {
        this.summary.set(fromServer);
        this.setPending(name, false);
      },
      // 3b. Failure: undo ONLY this reaction (another one may be on its way) + tell the visitor.
      error: () => {
        const now = this.summary();
        if (now) this.summary.set(applyReaction(now, name, !add));
        this.error.set("Couldn't save your reaction. Please try again.");
        this.setPending(name, false);
      },
    });
  }

  private setPending(name: ReactionName, on: boolean): void {
    this.pending.update((current) => {
      const next = new Set(current);
      if (on) next.add(name);
      else next.delete(name);
      return next;
    });
  }
}
