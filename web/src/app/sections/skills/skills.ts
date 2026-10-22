// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: skills.ts
// Skills section (04 · Technical toolkit): logic + data for this part of the page.
// Groups + skills come from the API (GET /api/skills).
// ──────────────────────────────────────────────────────────────────────

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SkillsService } from '../../core/skills.service';
import { SectionHeading } from '../../shared/section-heading/section-heading';

@Component({
  selector: 'app-skills',
  imports: [SectionHeading],
  templateUrl: './skills.html',
  styleUrl: './skills.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Skills {
  /** Skill groups come from the API (GET /api/skills), each with its skills inside. */
  protected readonly groups = inject(SkillsService).loadSkillGroups();
}
