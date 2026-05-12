import { describe, expect, it } from "vitest";
import { generateVerificationCode, hashCode, verifyCode } from "./verificationCode.js";

describe("generateVerificationCode", () => {
  it("returns a 6-digit numeric string", () => {
    expect(generateVerificationCode()).toMatch(/^\d{6}$/);
  });
  it("returns values in the range 100000–999999", () => {
    const value = parseInt(generateVerificationCode(), 10);
    expect(value).toBeGreaterThanOrEqual(100000);
    expect(value).toBeLessThanOrEqual(999999);
  });
  it("produces different values across calls", () => {
    const codes = new Set(Array.from({ length: 20 }, generateVerificationCode));
    expect(codes.size).toBeGreaterThan(1);
  });
});

describe("hashCode / verifyCode", () => {
  it("verifies a matching code", async () => {
    const hash = await hashCode("123456");
    expect(await verifyCode("123456", hash)).toBe(true);
  });
  it("rejects a non-matching code", async () => {
    const hash = await hashCode("123456");
    expect(await verifyCode("654321", hash)).toBe(false);
  });
});
