// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: section-heading.ts
// Section heading (shared, reusable): logic + data for this part of the page.
// Number + title + a line that draws itself, e.g. "01. What I do ────".
// ──────────────────────────────────────────────────────────────────────

import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-section-heading',
  templateUrl: './section-heading.html',
  styleUrl: './section-heading.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionHeading {
  /** Section number shown before the title, e.g. "01" */
  readonly index = input.required<string>();
  /** The section's main heading */
  readonly title = input.required<string>();
  /** Id for the <h2>, so the parent section can point aria-labelledby at it */
  readonly headingId = input.required<string>();
}
