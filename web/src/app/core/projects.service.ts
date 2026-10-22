// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: projects.service.ts
// Talks to /api/projects: loads projects + categories with httpResource.
// Components ask THIS service for data instead of calling the API themselves.
// Flow: component → service (THIS) → API → Postgres → back as JSON
// ──────────────────────────────────────────────────────────────────────

import { httpResource } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ProjectsResponse } from '../project';
import { API_BASE_URL } from './api.config';

/**
 * Owns all communication with the /projects endpoints.
 * Components ask this service for data instead of calling the API themselves.
 *
 * Each method returns an httpResource, so it must be called while the
 * component is being created (e.g. in a field initializer).
 */
@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private readonly baseUrl = inject(API_BASE_URL);

  /**
   * GET /api/projects, optionally ?category=...
   * `category` is a signal: whenever it changes, the request is sent again automatically.
   */
  loadProjects(category: () => string | null) {
    return httpResource<ProjectsResponse>(() => {
      const selected = category();
      const params: Record<string, string> = selected ? { category: selected } : {};
      return { url: `${this.baseUrl}/projects`, params };
    });
  }

  /** GET /api/projects/categories → e.g. ["Banking", "Lending", "Payments"] */
  loadCategories() {
    return httpResource<string[]>(() => `${this.baseUrl}/projects/categories`);
  }
}
