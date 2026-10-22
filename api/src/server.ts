// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: server.ts
// Starting point of the API. `npm run dev` runs this file.
// It takes the app built in app.ts and starts listening on the port (3000).
// Kept tiny on purpose: no features live here.
// ──────────────────────────────────────────────────────────────────────

import { app } from "./app.js";
import { env } from "./config/env.js";

/**
 * Entry point: starts the HTTP server. Nothing else belongs here.
 */
app.listen(env.port, () => {
  console.log(`API running at http://localhost:${env.port}`);
});
