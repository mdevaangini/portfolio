// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: app.ts
// Root component: just a <router-outlet>. Which frame (layout) a page gets
// is decided by the routes in app.routes.ts, not here.
// ──────────────────────────────────────────────────────────────────────

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
