// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: admin-comments.service.spec.ts
// The badge count: refreshPendingCount asks the API and puts
// counts.pending into the shared signal. Fake backend: HttpTestingController.
// Run: `npm test` in web/.
// ──────────────────────────────────────────────────────────────────────

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AdminCommentsService } from './admin-comments.service';

describe('AdminCommentsService', () => {
  it('refreshPendingCount puts the pending count into the badge signal', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const service = TestBed.inject(AdminCommentsService);
    const http = TestBed.inject(HttpTestingController);

    expect(service.pendingCount()).toBeNull(); // not known yet
    service.refreshPendingCount();

    const request = http.expectOne((req) => req.url === '/api/admin/comments' && req.params.get('status') === 'pending');
    request.flush({ data: [], counts: { pending: 3, approved: 10, rejected: 1 } });

    expect(service.pendingCount()).toBe(3);
    http.verify();
  });
});
