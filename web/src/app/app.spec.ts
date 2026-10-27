// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: app.spec.ts
// Unit tests for the root component (the shared frame: header, footer,
// router-outlet). The hero headline is tested in pages/home/home.spec.ts.
// Run: `npm test`.
// ──────────────────────────────────────────────────────────────────────

import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DeferBlockBehavior, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      // HttpClient is needed by the Projects section; the testing version
      // makes sure no real request ever leaves the test.
      // provideRouter([]): <router-outlet> needs a router; no pages are needed
      // to test the frame itself.
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
      // Keep @defer blocks (the Projects section) on their placeholder,
      // so this test only checks the page shell.
      deferBlockBehavior: DeferBlockBehavior.Manual,
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should only show nav links for sections that exist', () => {
    const fixture = TestBed.createComponent(App);
    // Draw the page once. (Don't wait for "stable": Experience and Skills start
    // API requests that never finish in tests, because no real request leaves.)
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const links = Array.from(compiled.querySelectorAll('.nav__link')).map((a) => a.textContent?.trim());
    expect(links).toEqual(['01. expertise', '02. work', '03. experience', '04. skills']);
  });
});
