// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: expertise.ts
// Expertise section (01 · What I do): logic + data for this part of the page.
// Static data.
// ──────────────────────────────────────────────────────────────────────

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SectionHeading } from '../../shared/section-heading/section-heading';

type ExpertiseIcon = 'bolt' | 'grid' | 'pulse' | 'form';

interface ExpertiseArea {
  icon: ExpertiseIcon;
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
      icon: 'bolt',
      title: 'Performance engineering',
      description:
        'Cut page load times by 60% with an OnPush change detection strategy and optimised rendering for data-heavy financial screens.',
    },
    {
      icon: 'grid',
      title: 'Component libraries & micro-frontends',
      description:
        'Reusable Angular Material and PrimeNG libraries that standardise UI patterns across 15+ modules, and key modules within a micro-frontend architecture.',
    },
    {
      icon: 'pulse',
      title: 'Reactive, real-time data',
      description:
        'RxJS data flows for high-concurrency banking scenarios, and 30+ complex RESTful APIs powering real-time dashboards and transaction workflows.',
    },
    {
      icon: 'form',
      title: 'Complex forms & workflows',
      description:
        'Multi-step loan application forms with complex validation, conditional field rendering and real-time field-level error handling.',
    },
  ];
}
