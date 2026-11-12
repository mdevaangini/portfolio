// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: app.ts
// Root component: a <router-outlet> + the shared dialog host. Which frame
// (layout) a page gets is decided by the routes in app.routes.ts, not here.
// ──────────────────────────────────────────────────────────────────────

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DialogHost } from '@shared/ui/dialog/dialog-host';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DialogHost],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
