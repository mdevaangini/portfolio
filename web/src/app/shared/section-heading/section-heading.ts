// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: section-heading.ts
// Section heading (shared, reusable): logic + data for this part of the page.
// Number + small label + title, used by every section.
// ──────────────────────────────────────────────────────────────────────

import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The "01 · What I do" label plus title used at the top of every section.
 * Built once, configured through inputs.
 */
@Component({
  selector: 'app-section-heading',
  templateUrl: './section-heading.html',
  styleUrl: './section-heading.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.on-dark]': "tone() === 'dark'",
  },
})
export class SectionHeading {
  /** Section number shown before the label, e.g. "01" */
  readonly index = input.required<string>();
  /** Small label above the title, e.g. "What I do" */
  readonly eyebrow = input.required<string>();
  /** The section's main heading */
  readonly title = input.required<string>();
  /** Id for the <h2>, so the parent section can point aria-labelledby at it */
  readonly headingId = input.required<string>();
  /** Use 'dark' on navy backgrounds */
  readonly tone = input<'light' | 'dark'>('light');
}
