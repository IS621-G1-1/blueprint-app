import { describe, expect, it } from "vitest";
import { isSixDigitCode, isSmuEmail } from "./validation";

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

describe("isSixDigitCode", () => {
  it("accepts a valid 6-digit code", () => {
    expect(isSixDigitCode("123456")).toBe(true);
  });
  it("accepts all-zeros code", () => {
    expect(isSixDigitCode("000000")).toBe(true);
  });
  it("rejects a 5-digit code", () => {
    expect(isSixDigitCode("12345")).toBe(false);
  });
  it("rejects a 7-digit code", () => {
    expect(isSixDigitCode("1234567")).toBe(false);
  });
  it("rejects alphanumeric input", () => {
    expect(isSixDigitCode("12345a")).toBe(false);
  });
  it("rejects an empty string", () => {
    expect(isSixDigitCode("")).toBe(false);
  });
});
