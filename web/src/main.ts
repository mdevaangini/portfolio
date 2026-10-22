// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: main.ts
// Starting point of the Angular app: boots the root component (App) with app.config.
// ──────────────────────────────────────────────────────────────────────

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
