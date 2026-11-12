// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: dialog-host.ts
// The ONE place the dialog is drawn (placed once in app.html). It watches
// DialogService.request(): a question → open the HTML <dialog> with
// showModal(); null → close it. showModal() gives us, from the browser:
// the dark backdrop, "the rest of the page can't be clicked", focus kept
// inside the dialog, and Esc to cancel.
// ──────────────────────────────────────────────────────────────────────

import { afterRenderEffect, ChangeDetectionStrategy, Component, ElementRef, inject, viewChild } from '@angular/core';
import { DialogService } from './dialog.service';

@Component({
  selector: 'app-dialog-host',
  templateUrl: './dialog-host.html',
  styleUrl: './dialog-host.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogHost {
  protected readonly dialog = inject(DialogService);
  private readonly dialogEl = viewChild.required<ElementRef<HTMLDialogElement>>('dialogEl');

  constructor() {
    // After Angular has drawn the buttons, open or close the real <dialog>.
    // (afterRenderEffect, not effect: the buttons must exist first, so the
    // browser can put the focus on the "autofocus" one.)
    afterRenderEffect(() => {
      const el = this.dialogEl().nativeElement;
      const isAsking = this.dialog.request() !== null;
      if (isAsking && !el.open) el.showModal();
      if (!isAsking && el.open) el.close();
    });
  }

  /** The browser closed it by itself (Esc key): treat as "no". */
  protected onClose(): void {
    this.dialog.answer(false);
  }

  /** A click on the dark backdrop lands on <dialog> itself (the card is the inner div): "no". */
  protected onDialogClick(event: MouseEvent): void {
    if (event.target === this.dialogEl().nativeElement) this.dialog.answer(false);
  }
}
