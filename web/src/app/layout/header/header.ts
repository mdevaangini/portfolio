import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

interface NavItem {
  label: string;
  /** Id of the section this link scrolls to */
  target: string;
  /** false until that section exists on the page, so the link is hidden instead of going nowhere */
  ready: boolean;
}

@Component({
  selector: 'app-header',
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:scroll)': 'onScroll()',
  },
})
export class Header {
  private readonly allNavItems: NavItem[] = [
    { label: 'Expertise', target: 'expertise', ready: true },
    { label: 'Work', target: 'work', ready: true },
    { label: 'Experience', target: 'experience', ready: false },
    { label: 'Skills', target: 'skills', ready: false },
  ];

  /** Only links whose section exists */
  protected readonly navItems = this.allNavItems.filter((item) => item.ready);

  /** Set to true once the Contact section exists */
  protected readonly contactReady = false;

  /** True once the page has scrolled, so the header can show a soft shadow */
  protected readonly scrolled = signal(false);

  protected onScroll(): void {
    this.scrolled.set(window.scrollY > 8);
  }
}
