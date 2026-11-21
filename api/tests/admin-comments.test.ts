// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: tests/admin-comments.test.ts
// Moderation is admin-only: without a valid login, every comment admin
// endpoint answers 401 and nothing runs (no database needed). The
// moderation itself is tested by hand in Postman. Run: `npm test`.
// ──────────────────────────────────────────────────────────────────────

import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app.js";

describe("/api/admin/comments without logging in", () => {
  it("the review queue → 401", async () => {
    const res = await request(app).get("/api/admin/comments");
    expect(res.status).toBe(401);
  });

  it("approving a comment → 401", async () => {
    const res = await request(app).post("/api/admin/comments/1/approve");
    expect(res.status).toBe(401);
  });

  it("replying as the author → 401", async () => {
    const res = await request(app).post("/api/admin/comments/1/reply").send({ body: "Thanks!" });
    expect(res.status).toBe(401);
  });
});
