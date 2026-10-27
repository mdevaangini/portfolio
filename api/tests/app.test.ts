// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: tests/app.test.ts
// Tests for the parts of the API that run WITHOUT the database:
// unknown routes (404) and the contact form's checks (400, spam trap).
// Supertest sends a request straight into the Express `app` (no server,
// no port, no browser) and lets us check the reply. Run: `npm test`.
// ──────────────────────────────────────────────────────────────────────

import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app.js";

describe("Unknown routes", () => {
  it("answers 404 with a JSON message", async () => {
    const res = await request(app).get("/api/does-not-exist");

    expect(res.status).toBe(404);
    expect(res.body.error).toContain("Route not found");
  });
});

describe("POST /api/contact: checks before saving", () => {
  it("rejects an empty form with an error for every field", async () => {
    const res = await request(app).post("/api/contact").send({});

    expect(res.status).toBe(400);
    expect(Object.keys(res.body.fields)).toEqual(["name", "email", "message"]);
  });

  it("rejects an invalid email, and only flags the email", async () => {
    const res = await request(app)
      .post("/api/contact")
      .send({ name: "Asha", email: "not-an-email", message: "Hello!" });

    expect(res.status).toBe(400);
    expect(res.body.fields).toEqual({ email: "Please enter a valid email." });
  });

  it("rejects a message that is too long", async () => {
    const res = await request(app)
      .post("/api/contact")
      .send({ name: "Asha", email: "asha@example.com", message: "x".repeat(2001) });

    expect(res.status).toBe(400);
    expect(Object.keys(res.body.fields)).toEqual(["message"]);
  });

  it("quietly ignores bots that fill the hidden 'website' field", async () => {
    const res = await request(app)
      .post("/api/contact")
      .send({ name: "Bot", email: "bot@spam.com", message: "Buy now", website: "spam.com" });

    // Looks like success to the bot, but nothing was saved (no id in the reply).
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ ok: true });
  });
});
