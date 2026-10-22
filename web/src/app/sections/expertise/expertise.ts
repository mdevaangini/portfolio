// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: expertise.ts
// Expertise section (01 · What I do): logic + data for this part of the page.
// Static data.
// ──────────────────────────────────────────────────────────────────────

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SectionHeading } from '../../shared/section-heading/section-heading';

interface ExpertiseArea {
  /** Small code-style label above the title, e.g. "performance" → "// performance" */
  tag: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-expertise',
  imports: [SectionHeading],
  templateUrl: './expertise.html',
  styleUrl: './expertise.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Expertise {
  /** Each point is taken from the CV. */
  protected readonly areas: ExpertiseArea[] = [
    {
      tag: 'performance',
      title: 'Fast screens',
      description: '60% faster page loads with OnPush change detection and optimised rendering for data-heavy screens.',
    },
    {
      tag: 'architecture',
      title: 'Component libraries',
      description: 'Reusable Angular Material and PrimeNG libraries across 15+ modules and micro-frontends.',
    },
    {
      tag: 'data',
      title: 'Real-time data',
      description: 'RxJS data flows and 30+ REST APIs behind live dashboards and transaction workflows.',
    },
    {
      tag: 'forms',
      title: 'Complex workflows',
      description: 'Multi-step loan applications with conditional fields and real-time validation.',
    },
  ];
}
