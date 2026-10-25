// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: app.spec.ts
// Unit tests for the root component. Run: `npm test`.
// ──────────────────────────────────────────────────────────────────────

import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DeferBlockBehavior, TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      // HttpClient is needed by the Projects section; the testing version
      // makes sure no real request ever leaves the test.
      providers: [provideHttpClient(), provideHttpClientTesting()],
      // Keep @defer blocks (the Projects section) on their placeholder,
      // so this test only checks the page shell.
      deferBlockBehavior: DeferBlockBehavior.Manual,
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the hero headline', () => {
    const fixture = TestBed.createComponent(App);
    // Draw the page once. (Don't wait for "stable": Experience and Skills start
    // API requests that never finish in tests, because no real request leaves.)
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('I build Angular apps');
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
