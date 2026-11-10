// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: posts-page.ts
// /admin/posts. For now (step 6a) a placeholder that proves the login, the
// guard and the cookies work. The posts table arrives in step 6b.
// ──────────────────────────────────────────────────────────────────────

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthService } from '@core/auth/auth.service';

@Component({
  selector: 'app-posts-page',
  template: `
    <h1>Posts</h1>
    <p>Logged in as <strong>{{ auth.currentUser()?.email }}</strong>. The posts table arrives in step 6b.</p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostsPage {
  protected readonly auth = inject(AuthService);
}
