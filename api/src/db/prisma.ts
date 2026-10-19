import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";
import { env } from "../config/env.js";

/**
 * The single shared Prisma Client. Created once when the app starts;
 * every service imports it from here.
 *
 * The adapter is the bridge: Prisma writes the SQL, and the adapter
 * sends it to PostgreSQL through the `pg` driver.
 */
const adapter = new PrismaPg({ connectionString: env.databaseUrl });

export const prisma = new PrismaClient({ adapter });
