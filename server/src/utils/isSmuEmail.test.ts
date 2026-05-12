import { describe, expect, it } from "vitest";
import { isSmuEmail } from "./isSmuEmail.js";

describe("isSmuEmail", () => {
  it("accepts a valid SMU email", () => {
    expect(isSmuEmail("student@smu.edu.sg")).toBe(true);
  });
  it("rejects a non-SMU email", () => {
    expect(isSmuEmail("student@gmail.com")).toBe(false);
  });
  it("is case-insensitive", () => {
    expect(isSmuEmail("Student@SMU.EDU.SG")).toBe(true);
  });
  it("trims leading and trailing whitespace", () => {
    expect(isSmuEmail("  student@smu.edu.sg  ")).toBe(true);
  });
  it("rejects an empty string", () => {
    expect(isSmuEmail("")).toBe(false);
  });
  it("rejects a subdomain spoofing attempt", () => {
    expect(isSmuEmail("student@fake.smu.edu.sg.evil.com")).toBe(false);
  });
});
