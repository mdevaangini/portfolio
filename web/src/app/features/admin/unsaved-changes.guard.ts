// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: unsaved-changes.guard.ts
// A CanDeactivate guard: before leaving a page (link, back button, another
// admin page), it asks the page "do you have unsaved changes?". If yes, our
// shared dialog asks "Leave without saving?"; Stay keeps you on the page.
// The guard returns the dialog's Promise: the router simply waits for it.
// (Closing/reloading the tab is handled by the page itself, with
// "beforeunload": there only the browser's own box is allowed.)
// Used by: the post editor routes in admin.routes.ts.
// ──────────────────────────────────────────────────────────────────────

import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { DialogService } from '@shared/ui/dialog/dialog.service';

/** Any page that can tell whether it has unsaved work. */
export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (page) => {
  if (!page.hasUnsavedChanges()) return true;
  return inject(DialogService).confirm({
    title: 'Leave without saving?',
    message: 'You have unsaved changes to this post. They will be lost.',
    confirmText: 'Leave',
    cancelText: 'Stay',
    danger: true,
  });
};
