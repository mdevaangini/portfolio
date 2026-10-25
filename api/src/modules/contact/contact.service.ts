// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: contact.service.ts
// Database layer for contact: the Prisma calls (WRITE: save one message).
// The ONLY place in this feature that talks to Postgres.
// Flow: routes → controller → service (THIS) → Prisma → Postgres
// ──────────────────────────────────────────────────────────────────────

import { prisma } from "../../db/prisma.js";

/** The data needed to save one message (already checked by the controller). */
export interface NewMessage {
  name: string;
  email: string;
  message: string;
}

/**
 * Saves one contact message. This is a WRITE: Prisma turns it into
 *   INSERT INTO "messages" (name, email, message) VALUES (...)
 * Postgres fills in id and created_at by itself.
 *
 * `select` keeps the reply small: we only send back the new id and the time.
 */
/**
 * How many messages arrived since `since`: from this email address, and in total.
 * Used for rate limiting. Both counts run together in one transaction.
 *   SELECT COUNT(*) FROM messages WHERE created_at >= $1 AND email ILIKE $2;
 *   SELECT COUNT(*) FROM messages WHERE created_at >= $1;
 */
export async function countRecentMessages(email: string, since: Date) {
  const [fromThisEmail, total] = await prisma.$transaction([
    prisma.message.count({
      where: { createdAt: { gte: since }, email: { equals: email, mode: "insensitive" } },
    }),
    prisma.message.count({ where: { createdAt: { gte: since } } }),
  ]);
  return { fromThisEmail, total };
}

export function createMessage(data: NewMessage) {
  return prisma.message.create({
    data,
    select: { id: true, createdAt: true },
  });
}
