// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: hero.ts
// Hero (first screen): logic + data for this part of the page.
// Name, headline, Download CV and View my work buttons.
// ──────────────────────────────────────────────────────────────────────

import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-hero',
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Hero {
  /**
   * The CV lives in /public, which Angular serves from the site root.
   * To update it, replace the file and keep the same name; no code change needed.
   */
  protected readonly cv = {
    path: 'Devaangini-Mehta-CV.pdf',
    downloadName: 'Devaangini-Mehta-CV.pdf',
  };
}
