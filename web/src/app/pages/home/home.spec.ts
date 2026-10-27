// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: pages/home/home.spec.ts
// Unit test for the Home page: the hero headline is on it. Run: `npm test`.
// ──────────────────────────────────────────────────────────────────────

import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DeferBlockBehavior, TestBed } from '@angular/core/testing';
import { Home } from './home';

describe('Home', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      // Experience, Skills and Contact use HttpClient; the testing version
      // makes sure no real request ever leaves the test.
      providers: [provideHttpClient(), provideHttpClientTesting()],
      // Keep @defer blocks (the Projects section) on their placeholder.
      deferBlockBehavior: DeferBlockBehavior.Manual,
    }).compileComponents();
  });

  it('should render the hero headline', () => {
    const fixture = TestBed.createComponent(Home);
    // Draw the page once. (Don't wait for "stable": Experience and Skills start
    // API requests that never finish in tests, because no real request leaves.)
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('I build Angular apps');
  });
});
