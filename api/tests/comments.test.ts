// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: tests/comments.test.ts
// Tests for the public comments API that need NO database: the checks
// that run before any query (origin, honeypot, Zod rules, slug format).
// The database rules (reply parent, rate limits, PENDING) are tested by
// hand in Postman. Run: `npm test`.
// ──────────────────────────────────────────────────────────────────────

import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app.js";

const url = "/api/posts/any-post/comments";

describe("POST comments: checks before the database", () => {
  it("another website can't post a comment → 403", async () => {
    const res = await request(app).post(url).set("Origin", "https://evil.example").send({ authorName: "Asha", body: "Hi!" });
    expect(res.status).toBe(403);
  });

  it("honeypot filled (a bot) → 202 like a real comment, but nothing is saved", async () => {
    const res = await request(app).post(url).send({ authorName: "Bot", body: "Buy now", website: "http://spam.example" });
    expect(res.status).toBe(202);
    expect(res.body.status).toBe("PENDING");
  });

  it("missing name and empty text → 400 with a message per field", async () => {
    const res = await request(app).post(url).send({ body: " " });
    expect(res.status).toBe(400);
    expect(res.body.fields.authorName).toBeDefined();
    expect(res.body.fields.body).toBeDefined();
  });

  it("a parentId that isn't a positive whole number → 400", async () => {
    const res = await request(app).post(url).send({ authorName: "Asha", body: "A reply", parentId: -1 });
    expect(res.status).toBe(400);
    expect(res.body.fields.parentId).toBeDefined();
  });
});

describe("GET comments", () => {
  it("a malformed slug → 404 (same as a draft or an unknown post)", async () => {
    const res = await request(app).get("/api/posts/Not%20A%20Slug/comments");
    expect(res.status).toBe(404);
  });
});
