// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: vitest.config.ts
// Settings for the API tests (`npm test`). Vitest = the test runner
// (like Angular's `npm test`); Supertest = sends fake HTTP requests to the app.
// ──────────────────────────────────────────────────────────────────────

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Test files live in api/tests/ and end with .test.ts
    include: ["tests/**/*.test.ts"],
    // Fake settings for tests. env.ts needs a DATABASE_URL to start, but these
    // tests never reach the database: they check what happens BEFORE it.
    // (Your real .env is NOT loaded, so tests can never touch your real data.)
    env: {
      DATABASE_URL: "postgresql://test:test@localhost:5432/not_used_in_tests",
      RESEND_API_KEY: "",
      NOTIFY_EMAIL: "",
    },
  },
});
