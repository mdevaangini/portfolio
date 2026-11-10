// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: app.spec.ts
// Unit test for the root component (just a <router-outlet>).
// The header's nav is tested in layouts/public-layout/public-layout.spec.ts,
// the hero headline in features/home/home.spec.ts. Run: `npm test`.
// ──────────────────────────────────────────────────────────────────────

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
