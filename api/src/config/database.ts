// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: database.ts
// Reads ONLY the database address (DATABASE_URL): the "storeroom key".
//
// Why a separate file? db/prisma.ts needs just this one setting. If it
// imported config/env.ts instead, every script that only touches the
// database (create-admin, seed) would also have to provide the server's
// other secrets, e.g. JWT_SECRET, which it never uses.
// "Least privilege": each piece of code asks only for what it needs.
//
// The SERVER still checks everything at start-up: config/env.ts re-uses
// this value and adds the rest (JWT_SECRET, CORS_ORIGIN, …).
// Used by: db/prisma.ts, config/env.ts
// ──────────────────────────────────────────────────────────────────────

function readDatabaseUrl(): string {
  const value = process.env["DATABASE_URL"];
  if (!value) {
    throw new Error("Missing required environment variable: DATABASE_URL (check your .env file)");
  }
  return value;
}

/** Connection string for PostgreSQL (local Postgres or Neon). Checked once, when first imported. */
export const databaseUrl = readDatabaseUrl();
