// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: auth.service.ts
// RECEPTION for login. Checks the password (and locks the account after too
// many wrong tries), then hands out the two things:
//   • a BADGE   = access token (JWT, 15 min), printed by lib/jwt.ts, stored nowhere
//   • a LOCKER KEY = refresh token (7 days), its fingerprint written in the BOOK
//                    (the refresh_tokens table)
// Also: refresh (key → new key + new badge) and logout (cross the key out).
// The ONLY place in this feature that talks to Postgres.
// Flow: routes → controller → service (THIS) → Prisma → Postgres
// ──────────────────────────────────────────────────────────────────────

import { prisma } from "../../db/prisma.js";
import { type AccessTokenUser, signAccessToken } from "../../lib/jwt.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { createRefreshToken, hashRefreshToken } from "../../lib/refresh-token.js";

/** Login rules, in one place. */
export const AUTH_RULES = {
  /** Wrong passwords in a row before the account locks */
  maxFailedLogins: 5,
  /** How long the lock lasts */
  lockMinutes: 15,
  /** How long the locker key (refresh token) works before you must log in again */
  refreshDays: 7,
};

/** What reception hands out: the badge, the key, and when the key expires. */
export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}

/** What a login attempt can end in. The controller turns each into a status code. */
export type LoginResult =
  | { kind: "ok"; user: AccessTokenUser; tokens: IssuedTokens }
  | { kind: "wrong" }
  | { kind: "locked"; until: Date };

/**
 * A fixed fake hash, used when the email doesn't exist, so that the check takes
 * the same time either way. Otherwise the speed of the reply would reveal
 * "this email has an account".
 */
const dummyHash = hashPassword("not-a-real-password-just-for-timing");

/**
 * Prints a new badge AND writes a new locker key in the book.
 * Used by login and by refresh.
 */
async function issueTokens(user: AccessTokenUser): Promise<IssuedTokens> {
  const refreshToken = createRefreshToken();
  const refreshExpiresAt = new Date(Date.now() + AUTH_RULES.refreshDays * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: { tokenHash: hashRefreshToken(refreshToken), userId: user.id, expiresAt: refreshExpiresAt },
  });

  return { accessToken: await signAccessToken(user), refreshToken, refreshExpiresAt };
}

/** LOGIN: tries email + password. Never says WHICH part was wrong. */
export async function login(email: string, password: string): Promise<LoginResult> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true, passwordHash: true, failedLogins: true, lockedUntil: true },
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

  // 4. Right password: reset the counter, throw away MY expired keys from the book,
  //    then hand out a new badge + key.
  await prisma.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null } });
  await prisma.refreshToken.deleteMany({ where: { userId: user.id, expiresAt: { lt: now } } });

  const me: AccessTokenUser = { id: user.id, email: user.email, role: user.role };
  return { kind: "ok", user: me, tokens: await issueTokens(me) };
}

/**
 * REFRESH: "my badge expired, here's my locker key".
 * The key works ONCE ("rotation"): its row is deleted and a new key is written.
 * So a stolen key that was already used is useless, and if a thief uses it first,
 * my own next refresh fails (a sign something is wrong).
 * Returns null if the key isn't in the book or has expired.
 */
export async function refresh(refreshToken: string): Promise<{ user: AccessTokenUser; tokens: IssuedTokens } | null> {
  const row = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashRefreshToken(refreshToken) },
    select: { id: true, expiresAt: true, user: { select: { id: true, email: true, role: true } } },
  });
  if (!row) return null;

  // Cross the old key out of the book (whether it's still valid or not).
  // deleteMany + count: if two refreshes race with the same key, only ONE wins.
  const { count } = await prisma.refreshToken.deleteMany({ where: { id: row.id } });
  if (count === 0 || row.expiresAt <= new Date()) return null;

  return { user: row.user, tokens: await issueTokens(row.user) };
}

/**
 * LOGOUT: crosses this locker key out of the book, so it stops working even
 * if someone kept a copy. deleteMany = no error if it's already gone.
 * (The badge can't be cancelled; it simply expires within 15 minutes.)
 */
export async function logout(refreshToken: string) {
  await prisma.refreshToken.deleteMany({ where: { tokenHash: hashRefreshToken(refreshToken) } });
}
