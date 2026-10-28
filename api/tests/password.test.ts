// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: tests/password.test.ts
// Tests for src/lib/password.ts: the password "fingerprint" (no database).
// Run: `npm test`.
// ──────────────────────────────────────────────────────────────────────

import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../src/lib/password.js";

describe("password hashing", () => {
  it("never stores the password itself", async () => {
    const stored = await hashPassword("correct horse battery");

    expect(stored).not.toContain("correct horse battery");
    expect(stored.startsWith("scrypt$")).toBe(true);
  });

  it("accepts the right password and rejects a wrong one", async () => {
    const stored = await hashPassword("correct horse battery");

    expect(await verifyPassword("correct horse battery", stored)).toBe(true);
    expect(await verifyPassword("Correct horse battery", stored)).toBe(false);
  });

  it("gives the same password a different hash each time (random salt)", async () => {
    const first = await hashPassword("same password here");
    const second = await hashPassword("same password here");

    expect(first).not.toBe(second);
  });

  it("rejects a stored value that isn't a valid hash", async () => {
    expect(await verifyPassword("anything", "not-a-hash")).toBe(false);
  });
});
