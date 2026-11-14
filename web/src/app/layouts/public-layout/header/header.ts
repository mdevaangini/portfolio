// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: header.ts
// Header (sticky top bar): logic + data for this part of the page.
// Holds the nav links; shows a shadow once you scroll.
// The section links are ROUTER links to "/" + the section ("/#work"), so
// they also work from the blog: they go back to Home, then scroll there.
// "blog" is a normal page link, highlighted while you are on /blog.
// ──────────────────────────────────────────────────────────────────────

import { ViewportScroller } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  label: string;
  /** Id of the section this link scrolls to */
  target: string;
  /** false until that section exists on the page, so the link is hidden instead of going nowhere */
  ready: boolean;
}

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:scroll)': 'onScroll()',
  },
})
export class Header {
  private readonly allNavItems: NavItem[] = [
    { label: 'expertise', target: 'expertise', ready: true },
    { label: 'work', target: 'work', ready: true },
    { label: 'experience', target: 'experience', ready: true },
    { label: 'skills', target: 'skills', ready: true },
  ];

  /** Only links whose section exists, numbered "01", "02"… to match the section headings */
  protected readonly navItems = this.allNavItems
    .filter((item) => item.ready)
    .map((item, i) => ({ ...item, number: String(i + 1).padStart(2, '0') }));

  /** Set to true once the Contact section exists */
  protected readonly contactReady = true;

  constructor() {
    // When the router scrolls to a section, stop it just below this sticky
    // header (otherwise the header would cover the section's title).
    const host = inject<ElementRef<HTMLElement>>(ElementRef);
    inject(ViewportScroller).setOffset(() => [0, host.nativeElement.querySelector('header')?.offsetHeight ?? 0]);
  }

  /** True once the page has scrolled, so the header can show a soft shadow */
  protected readonly scrolled = signal(false);

  protected onScroll(): void {
    this.scrolled.set(window.scrollY > 8);
  }
}
