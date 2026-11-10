// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: public-layout.spec.ts
// Unit test for the public frame: the header's nav shows exactly the
// sections that exist. Run: `npm test`.
// ──────────────────────────────────────────────────────────────────────

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PublicLayout } from './public-layout';

describe('PublicLayout', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicLayout],
      // <router-outlet> needs a router; no pages are needed to test the frame itself.
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should only show nav links for sections that exist', () => {
    const fixture = TestBed.createComponent(PublicLayout);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const links = Array.from(compiled.querySelectorAll('.nav__link')).map((a) => a.textContent?.trim());
    expect(links).toEqual(['01. expertise', '02. work', '03. experience', '04. skills']);
  });
});
