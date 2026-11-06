// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: tests/posts.test.ts
// Tests for blog posts that need NO database: the slug maker, the Zod rules
// (admin-posts.schema.ts), "the posts door is locked", and "bad input is
// refused before anything is saved". Run: `npm test`.
// ──────────────────────────────────────────────────────────────────────

import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { signAccessToken } from "../src/lib/jwt.js";
import { toSlug } from "../src/lib/slug.js";
import { checkBody, createPostSchema, toTagList, updatePostSchema } from "../src/modules/admin-posts/admin-posts.schema.js";

const me = { id: 1, email: "me@example.com", role: "ADMIN" as const };

describe("toSlug", () => {
  it("turns a title into an address-friendly slug", () => {
    expect(toSlug("Signals vs RxJS: when I use which!")).toBe("signals-vs-rxjs-when-i-use-which");
    expect(toSlug("  Café — Ñandú  ")).toBe("cafe-nandu");
    expect(toSlug("OnPush & the 60% speed-up")).toBe("onpush-the-60-speed-up");
  });
});

describe("createPostSchema (Zod rules for a new post)", () => {
  it("accepts a minimal post and cleans it (trims the title)", () => {
    const check = checkBody(createPostSchema, { title: "  Signals vs RxJS  " });

    expect(check).toEqual({ ok: true, data: { title: "Signals vs RxJS" } });
  });

  it("reports every problem at once, one message per field", () => {
    const check = checkBody(createPostSchema, { title: "Hi", slug: "Not A Slug!", coverImageUrl: "http://x.com/a.png" });

    expect(check.ok).toBe(false);
    if (!check.ok) expect(Object.keys(check.fields).sort()).toEqual(["coverImageUrl", "slug", "title"]);
  });

  it("treats an empty cover image as 'no image'", () => {
    const check = checkBody(createPostSchema, { title: "A fine title", coverImageUrl: "" });

    expect(check.ok && check.data.coverImageUrl).toBeNull();
  });

  it("lowercases tags and allows at most 8", () => {
    const ok = checkBody(createPostSchema, { title: "A fine title", tags: ["Angular", " Signals "] });
    const tooMany = checkBody(createPostSchema, { title: "A fine title", tags: ["aa", "bb", "cc", "dd", "ee", "ff", "gg", "hh", "ii"] });

    expect(ok.ok && ok.data.tags).toEqual(["angular", "signals"]);
    expect(tooMany.ok).toBe(false);
  });

  it("drops `status`: a new post can't be created as published", () => {
    const check = checkBody(createPostSchema, { title: "A fine title", status: "PUBLISHED" });

    expect(check.ok && "status" in check.data).toBe(false);
  });

  it("for editing (PATCH), every field is optional", () => {
    expect(checkBody(updatePostSchema, { excerpt: "Only this changed" }).ok).toBe(true);
  });
});

describe("toTagList", () => {
  it("removes duplicate tags and adds their slugs", () => {
    expect(toTagList(["angular", "angular", "node js"])).toEqual([
      { name: "angular", slug: "angular" },
      { name: "node js", slug: "node-js" },
    ]);
  });
});

describe("The posts door", () => {
  it("GET /api/admin/posts without a badge → 401", async () => {
    const res = await request(app).get("/api/admin/posts");
    expect(res.status).toBe(401);
  });

  it("POST /api/admin/posts without a badge → 401 (nothing is saved)", async () => {
    const res = await request(app).post("/api/admin/posts").send({ title: "Sneaky post" });
    expect(res.status).toBe(401);
  });

  it("with a badge but a bad body → 400 with field messages, before the database", async () => {
    const badge = await signAccessToken(me);
    const res = await request(app).post("/api/admin/posts").set("Cookie", `access_token=${badge}`).send({ title: "Hi" });

    expect(res.status).toBe(400);
    expect(res.body.fields.title).toBe("Title must be 3–150 characters.");
  });
});

describe("Editing, publishing and deleting: checks before the database", () => {
  const withBadge = async () => `access_token=${await signAccessToken(me)}`;

  it("PATCH without a badge → 401", async () => {
    const res = await request(app).patch("/api/admin/posts/1").send({ title: "New title" });
    expect(res.status).toBe(401);
  });

  it("PATCH with nothing to change → 400", async () => {
    const res = await request(app).patch("/api/admin/posts/1").set("Cookie", await withBadge()).send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Nothing to change: send at least one field.");
  });

  it("PATCH with a bad field → 400 with its message", async () => {
    const res = await request(app).patch("/api/admin/posts/1").set("Cookie", await withBadge()).send({ title: "Hi" });
    expect(res.status).toBe(400);
    expect(res.body.fields.title).toBe("Title must be 3–150 characters.");
  });

  it("publish / unpublish / delete with an id that isn't a number → 400", async () => {
    const cookie = await withBadge();
    expect((await request(app).post("/api/admin/posts/abc/publish").set("Cookie", cookie)).status).toBe(400);
    expect((await request(app).post("/api/admin/posts/abc/unpublish").set("Cookie", cookie)).status).toBe(400);
    expect((await request(app).delete("/api/admin/posts/abc").set("Cookie", cookie)).status).toBe(400);
  });

  it("DELETE without a badge → 401 (nothing is deleted)", async () => {
    const res = await request(app).delete("/api/admin/posts/1");
    expect(res.status).toBe(401);
  });
});
