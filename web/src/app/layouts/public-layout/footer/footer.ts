// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: footer.ts
// Footer (bottom bar of the page): copyright and the tech the site is built with.
// ──────────────────────────────────────────────────────────────────────

import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {
  /** Always the current year, so it never goes out of date. */
  protected readonly year = new Date().getFullYear();
}
