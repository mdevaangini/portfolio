// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: contact.service.ts
// Talks to POST /api/contact: sends one contact message.
// This is a WRITE, so it uses HttpClient.post (httpResource is only for reading).
// Flow: component → service (THIS) → API → Prisma → Postgres
// ──────────────────────────────────────────────────────────────────────

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ContactRequest } from '../contact';
import { API_BASE_URL } from './api.config';

@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /** POST /api/contact. Nothing is sent until someone subscribes. */
  send(body: ContactRequest) {
    return this.http.post<{ ok: true }>(`${this.baseUrl}/contact`, body);
  }
}
