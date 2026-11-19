// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: tests/reactions.test.ts
// Tests for the reactions API that need NO database: the checks that run
// before any query (wrong origin, unknown reaction, malformed slug) and
// the visitor-id cookie helper. The database parts (counting, the unique
// rule) are tested by hand in Postman. Run: `npm test`.
// ──────────────────────────────────────────────────────────────────────

import type { Request } from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { readVisitorId } from "../src/lib/visitor-id.js";

describe("reactions: checks before the database", () => {
  it("another website can't add a reaction → 403", async () => {
    const res = await request(app).put("/api/posts/any-post/reactions/like").set("Origin", "https://evil.example");
    expect(res.status).toBe(403);
  });

  it("an unknown reaction → 400", async () => {
    const res = await request(app).put("/api/posts/any-post/reactions/angry");
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("like, love, insightful");
  });

  it("a malformed slug → 404 (same as a draft or an unknown post)", async () => {
    const res = await request(app).get("/api/posts/Not%20A%20Slug/reactions");
    expect(res.status).toBe(404);
  });
});

describe("readVisitorId", () => {
  const withCookie = (value: unknown) => ({ cookies: { visitor_id: value } }) as unknown as Request;

  it("accepts an id in our format", () => {
    const id = "7f3c9a1e-1b2c-4d5e-8f90-123456789abc";
    expect(readVisitorId(withCookie(id))).toBe(id);
  });

  it("ignores anything else (an edited cookie, or none)", () => {
    expect(readVisitorId(withCookie("hacked'; DROP TABLE"))).toBeNull();
    expect(readVisitorId(withCookie(undefined))).toBeNull();
  });
});
