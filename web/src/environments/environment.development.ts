// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: environment.development.ts
// Settings for DEVELOPMENT (`npm start`).
// Same '/api' as production: the dev server (localhost:4200) passes every
// /api request on to the API on your laptop (localhost:3000).
// That hand-over is set in proxy.conf.mjs (linked in angular.json → serve).
// ──────────────────────────────────────────────────────────────────────

export const environment = {
  apiBaseUrl: '/api',
};
