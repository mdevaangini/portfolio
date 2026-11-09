// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: tests/public-posts.test.ts
// Tests for the PUBLIC blog API that need no database: the query rules
// (?limit&offset&tag), a malformed slug → 404, and the reading-time maths.
// Run: `npm test`.
// ──────────────────────────────────────────────────────────────────────

import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { readingMinutes } from "../src/modules/posts/posts.service.js";

describe("GET /api/posts: checks before the database", () => {
  it("limit that isn't a number → 400", async () => {
    const res = await request(app).get("/api/posts?limit=abc");
    expect(res.status).toBe(400);
    expect(res.body.fields.limit).toBeDefined();
  });

  it("limit above 50 → 400", async () => {
    const res = await request(app).get("/api/posts?limit=100");
    expect(res.status).toBe(400);
  });

  it("a tag that isn't a slug → 400", async () => {
    const res = await request(app).get("/api/posts?tag=Not%20A%20Slug");
    expect(res.status).toBe(400);
    expect(res.body.fields.tag).toBeDefined();
  });
});

describe("GET /api/posts/:slug", () => {
  it("a malformed slug → 404 (same answer as a draft or an unknown post)", async () => {
    const res = await request(app).get("/api/posts/Not%20A%20Slug");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Post not found.");
  });
});

describe("readingMinutes", () => {
  it("about 200 words per minute, never less than 1", () => {
    expect(readingMinutes("")).toBe(1);
    expect(readingMinutes("word ".repeat(1000))).toBe(5);
  });
});
