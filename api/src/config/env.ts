/**
 * All settings the app reads from the environment (.env), in one place.
 * Every other file imports `env` from here instead of using process.env directly.
 *
 * Checked once at startup: if a required value is missing, the app stops
 * immediately with a clear message, instead of failing later on a request.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name} (check your .env file)`);
  }
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

export const env = {
  /** Connection string for PostgreSQL. Required: no sensible default exists. */
  databaseUrl: required("DATABASE_URL"),

  /** Port the API listens on */
  port: Number(optional("PORT", "3000")),

  /** The frontend address allowed to call this API (CORS) */
  corsOrigin: optional("CORS_ORIGIN", "http://localhost:4200"),
};
