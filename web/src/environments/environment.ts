// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: environment.ts
// Settings for the PRODUCTION build (`npm run build`, used by Vercel).
// During `npm start` (development) Angular swaps this file for
// environment.development.ts (see "fileReplacements" in angular.json).
// ──────────────────────────────────────────────────────────────────────

export const environment = {
  /**
   * The API is reached through the WEBSITE's own address: the browser calls
   * devaangini-portfolio.vercel.app/api/..., and the "rewrites" in vercel.json
   * pass it on to the API project. Same address for both = "same-site", which
   * the blog's login cookie needs (and CORS is no longer involved).
   */
  apiBaseUrl: '/api',
};
