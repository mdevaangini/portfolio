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
import { signAccessToken } from "../src/lib/jwt.js";

/** The admin, as printed on a test badge. */
const me = { id: 1, email: "me@example.com", role: "ADMIN" as const };

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

describe("POST /api/auth/login: checks before the database", () => {
  it("rejects a missing email or password with 400", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "me@example.com" });

    expect(res.status).toBe(400);
    expect(res.headers["set-cookie"]).toBeUndefined(); // no wristband
  });

  it("rejects values that aren't text (e.g. a hacker sends an object)", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: { $ne: "" }, password: ["x"] });

    expect(res.status).toBe(400);
  });
});

describe("me, refresh and logout without cookies", () => {
  it("me: no badge → 401 'Not logged in.'", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Not logged in.");
  });

  it("me: a valid badge → 200 with the user printed on it (no database needed)", async () => {
    const badge = await signAccessToken(me);
    const res = await request(app).get("/api/auth/me").set("Cookie", `access_token=${badge}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toEqual(me);
  });

  it("refresh: no locker key → 401, and both cookies are cleared", async () => {
    const res = await request(app).post("/api/auth/refresh");

    expect(res.status).toBe(401);
    const cookies = String(res.headers["set-cookie"]);
    expect(cookies).toContain("access_token=;");
    expect(cookies).toContain("refresh_token=;");
  });

  it("logout: no cookies → 204, and the browser is told to delete both cookies", async () => {
    const res = await request(app).post("/api/auth/logout");

    expect(res.status).toBe(204);
    const cookies = String(res.headers["set-cookie"]);
    expect(cookies).toContain("access_token=;");
    expect(cookies).toContain("refresh_token=;");
  });
});

describe("The admin door (requireAdmin guard checks the badge)", () => {
  it("no badge → 401, and the admin code never runs", async () => {
    const res = await request(app).get("/api/admin/check");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Not logged in.");
    expect(res.body.ok).toBeUndefined(); // the admin answer was never sent
  });

  it("a valid badge → 200 'You are the admin'", async () => {
    const badge = await signAccessToken(me);
    const res = await request(app).get("/api/admin/check").set("Cookie", `access_token=${badge}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("You are the admin: me@example.com");
  });

  it("an expired badge → 401", async () => {
    const badge = await signAccessToken(me, -10);
    const res = await request(app).get("/api/admin/check").set("Cookie", `access_token=${badge}`);

    expect(res.status).toBe(401);
  });

  it("a made-up badge → 401", async () => {
    const res = await request(app).get("/api/admin/check").set("Cookie", "access_token=made.up.badge");

    expect(res.status).toBe(401);
  });
});

describe("Origin check on changes", () => {
  it("blocks a change started from another website → 403", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Origin", "https://evil.example")
      .send({ email: "me@example.com", password: "whatever-password" });

    expect(res.status).toBe(403);
  });

  it("lets my own website through (here it reaches the normal 400 check)", async () => {
    const res = await request(app).post("/api/auth/login").set("Origin", "http://localhost:4200").send({});

    expect(res.status).toBe(400);
  });

  it("never blocks reading (GET), even from another website", async () => {
    const res = await request(app).get("/api/auth/me").set("Origin", "https://evil.example");

    expect(res.status).toBe(401); // the normal "not logged in", not 403
  });
});
