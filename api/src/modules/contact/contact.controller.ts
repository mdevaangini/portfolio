// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: contact.controller.ts
// HTTP layer for contact: reads the request body (name, email, message), checks it,
// calls the service, and decides the status code + JSON reply. Never touches the database.
// Flow: routes → controller (THIS) → service → Prisma → Postgres
// ──────────────────────────────────────────────────────────────────────

import type { Request, Response } from "express";
import { notifyNewMessage } from "./contact.email.js";
import { createMessage } from "./contact.service.js";

// Same limits as the columns in schema.prisma, so the database never has to refuse anything.
const MAX = { name: 100, email: 254, message: 2000 };

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

  // 4. All good: save it, and answer 201 "Created" (not 200), the standard reply
  //    when something new was stored.
  const saved = await createMessage({ name, email, message });

  // 5. Tell me by email. This never fails the request: the message is already
  //    saved, so even if the email can't be sent, the visitor still gets 201.
  await notifyNewMessage({ name, email, message });

  res.status(201).json({ ok: true, id: saved.id, createdAt: saved.createdAt });
}
