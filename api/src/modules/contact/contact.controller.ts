// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: contact.controller.ts
// HTTP layer for contact: reads the request body (name, email, message), checks it,
// calls the service, and decides the status code + JSON reply. Never touches the database.
// Flow: routes → controller (THIS) → service → Prisma → Postgres
// ──────────────────────────────────────────────────────────────────────

import type { Request, Response } from "express";
import { notifyNewMessage } from "./contact.email.js";
import { countRecentMessages, createMessage } from "./contact.service.js";

// Same limits as the columns in schema.prisma, so the database never has to refuse anything.
const MAX = { name: 100, email: 254, message: 2000 };

// Rate limits: protect my inbox and Resend's free quota (100 emails a day).
// In one hour: at most 3 messages from the same email address, 20 in total.
const RATE_LIMIT = { windowMinutes: 60, perEmail: 3, total: 20 };

// A simple "looks like an email" check: something@something.something
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Reads a field from the body: must be text; spaces at the ends are removed. */
function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * POST /api/contact
 * Body (JSON): { "name": "...", "email": "...", "message": "...", "website": "" }
 */
export async function sendMessage(req: Request, res: Response) {
  // 1. Read the body. express.json() (in app.ts) has already turned the JSON text
  //    into an object. If nothing was sent, use an empty object.
  const body = req.body ?? {};
  const name = text(body.name);
  const email = text(body.email);
  const message = text(body.message);

  // 2. Spam trap: "website" is a hidden field real visitors never see, so it stays empty.
  //    Bots fill in every field. If it's filled, pretend all went well but save nothing.
  if (text(body.website)) {
    res.status(201).json({ ok: true });
    return;
  }

  // 3. Check every field. Collect ALL problems at once, so the form can show
  //    each message next to its own field (not one error at a time).
  const fields: Record<string, string> = {};
  if (!name) fields.name = "Please enter your name.";
  else if (name.length > MAX.name) fields.name = `Name must be ${MAX.name} characters or fewer.`;

  if (!email) fields.email = "Please enter your email.";
  else if (email.length > MAX.email || !EMAIL_PATTERN.test(email)) fields.email = "Please enter a valid email.";

  if (!message) fields.message = "Please enter a message.";
  else if (message.length > MAX.message) fields.message = `Message must be ${MAX.message} characters or fewer.`;

  if (Object.keys(fields).length > 0) {
    res.status(400).json({ error: "Please check the form.", fields });
    return;
  }

  // 4. Rate limit: count the messages of the last hour (in the database, so it works
  //    on Vercel too, where many copies of the API run side by side).
  //    Too many → 429 "Too Many Requests": nothing is saved, no email is sent.
  const since = new Date(Date.now() - RATE_LIMIT.windowMinutes * 60 * 1000);
  const recent = await countRecentMessages(email, since);
  if (recent.fromThisEmail >= RATE_LIMIT.perEmail || recent.total >= RATE_LIMIT.total) {
    res.setHeader("Retry-After", String(RATE_LIMIT.windowMinutes * 60)); // seconds
    res.status(429).json({
      error: "Too many messages right now. Please try again in an hour, or email me directly.",
    });
    return;
  }

  // 5. All good: save it, and answer 201 "Created" (not 200), the standard reply
  //    when something new was stored.
  const saved = await createMessage({ name, email, message });

  // 6. Tell me by email. This never fails the request: the message is already
  //    saved, so even if the email can't be sent, the visitor still gets 201.
  await notifyNewMessage({ name, email, message });

  res.status(201).json({ ok: true, id: saved.id, createdAt: saved.createdAt });
}
