// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: skills.service.ts
// Talks to /api/skills: loads skill groups with httpResource.
// Components ask THIS service for data instead of calling the API themselves.
// Flow: component → service (THIS) → API → Postgres → back as JSON
// ──────────────────────────────────────────────────────────────────────

import { httpResource } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { SkillGroup } from '../skill';
import { API_BASE_URL } from './api.config';

/** Owns communication with the /skills endpoint. */
@Injectable({ providedIn: 'root' })
export class SkillsService {
  private readonly baseUrl = inject(API_BASE_URL);

  /** GET /api/skills → groups in display order, each with its skills */
  loadSkillGroups() {
    return httpResource<SkillGroup[]>(() => `${this.baseUrl}/skills`);
  }
}
