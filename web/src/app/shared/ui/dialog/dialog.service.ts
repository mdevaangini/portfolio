// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: dialog.service.ts
// The app's own "Are you sure?" dialog (instead of the browser's
// window.confirm). Anyone (a page, a guard) calls:
//     const ok = await dialog.confirm({ title, message, confirmText, danger });
// The service keeps the question in a signal; <app-dialog-host> (placed once
// in app.html) sees it, opens the <dialog>, and calls answer(true/false)
// when the user clicks. That answer resolves the Promise the caller awaits.
// Used by: unsaved-changes.guard.ts (leave the editor), posts-page (delete).
// ──────────────────────────────────────────────────────────────────────

import { Injectable, signal } from '@angular/core';

/** What the caller wants to ask. */
export interface ConfirmOptions {
  title: string;
  message: string;
  /** Text of the "yes" button (default "OK"). */
  confirmText?: string;
  /** Text of the "no" button (default "Cancel"). */
  cancelText?: string;
  /** true = the "yes" button is red (for destructive actions like Delete). */
  danger?: boolean;
}

/** The question currently on screen, plus the function that delivers the answer. */
export interface DialogRequest extends Required<ConfirmOptions> {
  resolve: (ok: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly current = signal<DialogRequest | null>(null);
  /** Read by the dialog host: null = closed, otherwise = show this question. */
  readonly request = this.current.asReadonly();

  /** Opens the dialog; the Promise gives true (confirmed) or false (cancelled, Esc, click outside). */
  confirm(options: ConfirmOptions): Promise<boolean> {
    // Only one dialog at a time: an older, unanswered question counts as "no".
    this.current()?.resolve(false);
    return new Promise<boolean>((resolve) =>
      this.current.set({ confirmText: 'OK', cancelText: 'Cancel', danger: false, ...options, resolve }),
    );
  }

  /** Called by the dialog host when the user answers. Closes the dialog. */
  answer(ok: boolean): void {
    const request = this.current();
    if (!request) return;
    this.current.set(null);
    request.resolve(ok);
  }
}
