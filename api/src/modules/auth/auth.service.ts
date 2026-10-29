// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: auth.service.ts
// Database layer for login: checks the password, counts wrong attempts
// (and locks the account for a while), creates the session row (login),
// finds it again (who am I?) and deletes it (logout).
// The ONLY place in this feature that talks to Postgres.
// Flow: routes → controller → service (THIS) → Prisma → Postgres
// ──────────────────────────────────────────────────────────────────────

import { prisma } from "../../db/prisma.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { createSessionToken, hashSessionToken } from "../../lib/session-token.js";

/** Login rules, in one place. */
export const AUTH_RULES = {
  /** Wrong passwords in a row before the account locks */
  maxFailedLogins: 5,
  /** How long the lock lasts */
  lockMinutes: 15,
  /** How long a login lasts before you must log in again */
  sessionDays: 7,
};

/** What a login attempt can end in. The controller turns each into a status code. */
export type LoginResult =
  | { kind: "ok"; token: string; expiresAt: Date; user: { id: number; email: string } }
  | { kind: "wrong" }
  | { kind: "locked"; until: Date };

/**
 * A fixed fake hash, used when the email doesn't exist, so that the check takes
 * the same time either way. Otherwise the speed of the reply would reveal
 * "this email has an account".
 */
const dummyHash = hashPassword("not-a-real-password-just-for-timing");

/** Tries to log in. Never says WHICH part was wrong (email or password). */
export async function login(email: string, password: string): Promise<LoginResult> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, passwordHash: true, failedLogins: true, lockedUntil: true },
  });

  // 1. Unknown email: do a password check anyway (same timing), then say "wrong".
  if (!user) {
    await verifyPassword(password, await dummyHash);
    return { kind: "wrong" };
  }

  // 2. Locked: don't even check the password until the lock ends.
  const now = new Date();
  if (user.lockedUntil && user.lockedUntil > now) {
    return { kind: "locked", until: user.lockedUntil };
  }

  // 3. Wrong password: count it. The 5th in a row locks the account for 15 minutes.
  if (!(await verifyPassword(password, user.passwordHash))) {
    const failed = user.failedLogins + 1;
    if (failed >= AUTH_RULES.maxFailedLogins) {
      const until = new Date(now.getTime() + AUTH_RULES.lockMinutes * 60 * 1000);
      await prisma.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: until } });
      return { kind: "locked", until };
    }
    await prisma.user.update({ where: { id: user.id }, data: { failedLogins: failed } });
    return { kind: "wrong" };
  }

  // 4. Right password: reset the counter, clean up old expired sessions, and
  //    create a new session (the wristband). Done together in one transaction.
  const token = createSessionToken();
  const expiresAt = new Date(now.getTime() + AUTH_RULES.sessionDays * 24 * 60 * 60 * 1000);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null } }),
    prisma.session.deleteMany({ where: { userId: user.id, expiresAt: { lt: now } } }),
    prisma.session.create({ data: { tokenHash: hashSessionToken(token), userId: user.id, expiresAt } }),
  ]);

  return { kind: "ok", token, expiresAt, user: { id: user.id, email: user.email } };
}

/**
 * Who does this key card belong to? Looks up the session by the token's
 * fingerprint. Returns null if there's no such session or it has expired.
 *   SELECT ... FROM sessions JOIN users ... WHERE token_hash = $1
 */
export async function findSessionUser(token: string) {
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    select: { expiresAt: true, user: { select: { id: true, email: true, role: true } } },
  });
  if (!session || session.expiresAt <= new Date()) return null;
  return session.user;
}

/**
 * Logout: deletes this key card's session row, so the card stops working
 * even if someone kept a copy. deleteMany = no error if it's already gone.
 */
export async function deleteSession(token: string) {
  await prisma.session.deleteMany({ where: { tokenHash: hashSessionToken(token) } });
}
