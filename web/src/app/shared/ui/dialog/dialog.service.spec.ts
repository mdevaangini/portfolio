// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: dialog.service.spec.ts
// Tests the dialog's "question → answer" logic, without drawing anything.
// Run: `npm test` in web/.
// ──────────────────────────────────────────────────────────────────────

import { TestBed } from '@angular/core/testing';
import { DialogService } from './dialog.service';

describe('DialogService', () => {
  let dialog: DialogService;

  beforeEach(() => {
    dialog = TestBed.inject(DialogService);
  });

  it('shows the question, and the caller gets the answer', async () => {
    const answer = dialog.confirm({ title: 'Delete?', message: 'Sure?', danger: true });
    expect(dialog.request()?.title).toBe('Delete?');
    expect(dialog.request()?.confirmText).toBe('OK'); // default filled in

    dialog.answer(true);
    expect(await answer).toBe(true);
    expect(dialog.request()).toBeNull(); // closed again
  });

  it('a new question answers the older one with "no"', async () => {
    const first = dialog.confirm({ title: 'First', message: '' });
    dialog.confirm({ title: 'Second', message: '' });
    expect(await first).toBe(false);
    expect(dialog.request()?.title).toBe('Second');
  });
});
