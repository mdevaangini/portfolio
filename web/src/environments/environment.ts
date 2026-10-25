// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: environment.ts
// Settings for the PRODUCTION build (`npm run build`, used by Vercel).
// During `npm start` (development) Angular swaps this file for
// environment.development.ts (see "fileReplacements" in angular.json).
// ──────────────────────────────────────────────────────────────────────

export const environment = {
  /** Address of the live API (the "portfolio" project on Vercel, production domain). */
  apiBaseUrl: 'https://portfolio-neon-six-56.vercel.app/api',
};
