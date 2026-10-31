// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: proxy.conf.mjs   (used ONLY on my laptop, by `npm start`)
//
// The "/api FRONT DESK" for development.
//
// The problem it solves:
//   On my laptop two servers run side by side:
//     • Angular dev server  → http://localhost:4200   (the website)
//     • Express API          → http://localhost:3000   (the data)
//   Angular calls "/api/skills", which means localhost:4200/api/skills.
//   But port 4200 has no API; the API lives on port 3000.
//
// What this file does:
//   It tells the Angular dev server: "when a request starts with /api,
//   don't answer it yourself: pass it on to localhost:3000 and hand the
//   answer back." The browser never knows port 3000 exists.
//
//     browser ──GET localhost:4200/api/skills──▶ Angular dev server
//                                                   │ forwards (this file)
//                                                   ▼
//                                     Express API on localhost:3000/api/skills
//
// Why we want this (instead of calling localhost:3000 directly):
//   The browser sees ONE address for the page and the data. That's what
//   makes the login cookie work safely (sameSite), with no CORS needed.
//   Live, the same job is done by "rewrites" in vercel.json, so the
//   Angular code is identical on the laptop and live: it always calls /api.
//
// Linked from angular.json → serve → options → "proxyConfig".
// If you change this file, restart `npm start`.
// (It's a .mjs file, not .json, only so it can hold these comments.)
// ──────────────────────────────────────────────────────────────────────

export default {
  // Every request whose path starts with /api …
  "/api": {
    // … is sent on to the API running on my laptop.
    target: "http://localhost:3000",
    // The API uses plain http on the laptop, not https.
    secure: false,
  },
};
