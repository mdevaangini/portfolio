// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: contact.email.ts
// Sends me an email (through Resend) when someone uses the contact form.
// Called by the controller AFTER the message is saved. Never throws: if email
// isn't set up or fails, it only logs, and the visitor still gets "Thanks".
// Flow: controller → THIS → Resend API → my Gmail inbox
// ──────────────────────────────────────────────────────────────────────

import { Resend } from "resend";
import { env } from "../../config/env.js";
import type { NewMessage } from "./contact.service.js";

// Created once, only if a key exists (locally you can run without one).
const resend = env.resendApiKey ? new Resend(env.resendApiKey) : null;

export async function notifyNewMessage(msg: NewMessage): Promise<void> {
  if (!resend || !env.notifyEmail) {
    console.log("[email] skipped: RESEND_API_KEY or NOTIFY_EMAIL not set");
    return;
  }

  // Plain text only: the visitor's words are shown exactly as typed,
  // never turned into HTML (so nobody can inject links or scripts).
  try {
    const { data, error } = await resend.emails.send({
      // Resend's shared sender. Fine for emails to myself; with my own domain
      // later this becomes e.g. "Portfolio <hello@my-domain>".
      from: "Portfolio <onboarding@resend.dev>",
      to: [env.notifyEmail],
      // Clicking "Reply" in Gmail answers the visitor directly
      replyTo: msg.email,
      subject: `New portfolio message from ${msg.name}`,
      text: `Name: ${msg.name}\nEmail: ${msg.email}\n\n${msg.message}\n\n— sent from the contact form on my portfolio`,
    });

    if (error) {
      console.error("[email] failed:", error.message);
    } else {
      console.log(`[email] sent to ${env.notifyEmail} (id ${data?.id})`);
    }
  } catch (err) {
    // e.g. no internet connection: log it, but don't break the request
    console.error("[email] failed:", err);
  }
}
