// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: tests/jwt.test.ts
// Tests for src/lib/jwt.ts: the badge machine (no database).
// Run: `npm test`.
// ──────────────────────────────────────────────────────────────────────

import { describe, expect, it } from "vitest";
import { signAccessToken, verifyAccessToken } from "../src/lib/jwt.js";

const me = { id: 1, email: "me@example.com", role: "ADMIN" as const };

describe("access token (JWT)", () => {
  it("a badge we printed is accepted, and tells who it belongs to", async () => {
    const token = await signAccessToken(me);

    expect(token.split(".")).toHaveLength(3); // header.payload.signature
    expect(await verifyAccessToken(token)).toEqual(me);
  });

  it("an expired badge is refused", async () => {
    const token = await signAccessToken(me, -10); // expired 10 seconds ago

    expect(await verifyAccessToken(token)).toBeNull();
  });

  it("a badge someone edited (e.g. changed the user id) is refused", async () => {
    const [header, payload, signature] = (await signAccessToken(me)).split(".");
    const edited = JSON.parse(Buffer.from(payload, "base64url").toString());
    edited.sub = "2"; // pretend to be someone else
    const forged = [header, Buffer.from(JSON.stringify(edited)).toString("base64url"), signature].join(".");

    expect(await verifyAccessToken(forged)).toBeNull();
  });

  it("random text is refused", async () => {
    expect(await verifyAccessToken("not-a-token")).toBeNull();
  });

  it("the badge's content is readable by anyone (so never put secrets in it)", async () => {
    const payload = (await signAccessToken(me)).split(".")[1];
    const readable = JSON.parse(Buffer.from(payload, "base64url").toString());

    expect(readable).toMatchObject({ sub: "1", email: "me@example.com", role: "ADMIN" });
  });
});
