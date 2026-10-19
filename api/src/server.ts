import { app } from "./app.js";
import { env } from "./config/env.js";

/**
 * Entry point: starts the HTTP server. Nothing else belongs here.
 */
app.listen(env.port, () => {
  console.log(`API running at http://localhost:${env.port}`);
});
