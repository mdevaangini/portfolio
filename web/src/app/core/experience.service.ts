import { httpResource } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Experience } from '../experience';
import { API_BASE_URL } from './api.config';

/** Owns communication with the /experience endpoint. */
@Injectable({ providedIn: 'root' })
export class ExperienceService {
  private readonly baseUrl = inject(API_BASE_URL);

  /** GET /api/experience → all jobs, newest first */
  loadExperiences() {
    return httpResource<Experience[]>(() => `${this.baseUrl}/experience`);
  }
}
