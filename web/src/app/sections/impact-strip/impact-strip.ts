// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: impact-strip.ts
// Impact strip (key numbers under the hero): logic + data for this part of the page.
// Static data.
// ──────────────────────────────────────────────────────────────────────

import { ChangeDetectionStrategy, Component } from '@angular/core';

interface Stat {
  value: string;
  label: string;
  /** true = outlined number that fills in as you scroll; false = solid apricot */
  outlined: boolean;
}

@Component({
  selector: 'app-impact-strip',
  templateUrl: './impact-strip.html',
  styleUrl: './impact-strip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImpactStrip {
  /** Figures taken from the CV. Keep them in sync when the CV changes. */
  protected readonly stats: Stat[] = [
    { value: '4.5+', label: 'years of Angular', outlined: true },
    { value: '150M+', label: 'users served', outlined: true },
    { value: '3B+', label: 'transactions a year', outlined: true },
    { value: '60%', label: 'faster page loads', outlined: false },
  ];
}
