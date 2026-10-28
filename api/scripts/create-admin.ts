// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: create-admin.ts
// Creates MY admin login for the blog (or resets its password).
// The ONLY way to create a user: there is no sign-up page on the website.
//
// Run (in api/):
//   local database:  npm run create-admin
//   live (Neon):     npx tsx --env-file=.env.production.local scripts/create-admin.ts
//
// It ASKS for the email and password (the password is hidden while typing),
// so the password never ends up in a file, in git, or in the terminal history.
// ──────────────────────────────────────────────────────────────────────

import { createInterface } from "node:readline/promises";
import { prisma } from "../src/db/prisma.js";
import { hashPassword } from "../src/lib/password.js";

const MIN_PASSWORD_LENGTH = 12;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });

/** Asks a question but shows nothing while typing (for passwords). */
async function askHidden(question: string): Promise<string> {
  process.stdout.write(question);
  // Swap readline's "print what was typed" step for one that prints nothing.
  const internal = rl as unknown as { _writeToOutput: (text: string) => void };
  const original = internal._writeToOutput;
  internal._writeToOutput = () => {};
  try {
    return await rl.question("");
  } finally {
    internal._writeToOutput = original;
    process.stdout.write("\n");
  }
}

async function main() {
  console.log("Create (or reset) the blog admin login\n");

  const email = (await rl.question("Email: ")).trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email)) throw new Error("That doesn't look like an email.");

  const password = await askHidden(`Password (min ${MIN_PASSWORD_LENGTH} characters): `);
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
  const again = await askHidden("Type it again: ");
  if (again !== password) throw new Error("The two passwords don't match.");

  const passwordHash = await hashPassword(password);

  // upsert = "update if it exists, otherwise create". So running it again with
  // the same email RESETS the password (and unlocks the account).
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  const user = await prisma.user.upsert({
    where: { email },
    create: { email, passwordHash, role: "ADMIN" },
    update: { passwordHash, failedLogins: 0, lockedUntil: null },
    select: { id: true, email: true },
  });

  if (existing) {
    // A new password should log out every browser that used the old one.
    const { count } = await prisma.session.deleteMany({ where: { userId: user.id } });
    console.log(`\n✔ Password reset for ${user.email} (id ${user.id}); ${count} session(s) logged out.`);
  } else {
    console.log(`\n✔ Admin created: ${user.email} (id ${user.id}).`);
  }
}

main()
  .catch((error: unknown) => {
    console.error(`\n✘ ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    rl.close();
    await prisma.$disconnect();
  });
