// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: admin-layout.ts
// The frame of every logged-in admin page (loaded lazily together with /admin): a top bar (Posts · Comments (badge) · View site ·
// who I am · Log out) and <router-outlet> for the page itself.
// ──────────────────────────────────────────────────────────────────────

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { AdminCommentsService } from '@features/admin/admin-comments.service';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayout {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** The pending-comments badge: a signal shared with the comments page (it updates it after each action). */
  protected readonly pendingCount = inject(AdminCommentsService).pendingCount;

  constructor() {
    // When the admin area opens: ask once how many comments wait for review.
    inject(AdminCommentsService).refreshPendingCount();
  }

  protected logout(): void {
    // Whatever the API answers, go to the login page (the user is forgotten either way).
    this.auth.logout().subscribe({
      complete: () => void this.router.navigate(['/admin/login']),
      error: () => void this.router.navigate(['/admin/login']),
    });
  }
}
