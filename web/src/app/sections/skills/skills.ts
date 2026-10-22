// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: skills.ts
// Skills section (04 · Technical toolkit): logic + data for this part of the page.
// Groups + skills come from the API (GET /api/skills).
// ──────────────────────────────────────────────────────────────────────

import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
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

  /**
   * The same groups, each with a folder-style label for display:
   * "State & reactivity" → "state-and-reactivity/"
   */
  protected readonly folders = computed(() =>
    (this.groups.value() ?? []).map((group) => ({
      ...group,
      folder: group.name.toLowerCase().replace(/\s*&\s*/g, '-and-').replace(/[\s,]+/g, '-') + '/',
    })),
  );
}
