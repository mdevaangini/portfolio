// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: public-layout.ts
// The frame of every PUBLIC page (Home now, the Blog later): skip link,
// site header, <main> with the current page, site footer.
// Chosen by the router in app.routes.ts; the admin area uses AdminLayout instead.
// ──────────────────────────────────────────────────────────────────────

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from './footer/footer';
import { Header } from './header/header';

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, Header, Footer],
  templateUrl: './public-layout.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicLayout {}
