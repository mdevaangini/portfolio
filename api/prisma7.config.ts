/**
 * Settings for the Prisma CLI (the `npx prisma ...` commands).
 * Not used by the running API: only by the terminal commands.
 *
 * The CLI is a separate program from our server, so it loads .env
 * itself through dotenv (the server uses --env-file instead).
 * 
 * 
 * prisma7.config.ts: instructions for the CLI. It answers three questions for the npx prisma commands:

        where is the schema? → prisma/schema.prisma
        where should migration files go? → prisma/migrations
        which database? → DATABASE_URL, read from .env
 */
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  // Where the table description lives
  schema: "prisma/schema.prisma",

  // Where migration files will be saved (used in a later step)
  migrations: {
    path: "prisma/migrations",
  },

  // Which database the CLI should read from and write to
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
