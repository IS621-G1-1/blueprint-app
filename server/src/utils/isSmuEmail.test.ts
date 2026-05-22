import { describe, expect, it } from "vitest";
import { isSmuEmail } from "./isSmuEmail.js";

describe("isSmuEmail", () => {
  it("accepts the root SMU email domain", () => {
    expect(isSmuEmail("student@smu.edu.sg")).toBe(true);
  });
  it("accepts the MITB SMU email domain", () => {
    expect(isSmuEmail("student@mitb.smu.edu.sg")).toBe(true);
  });
  it("accepts other SMU subdomains", () => {
    expect(isSmuEmail("student@sis.smu.edu.sg")).toBe(true);
  });
  it("rejects a non-SMU email", () => {
    expect(isSmuEmail("student@gmail.com")).toBe(false);
  });
  it("is case-insensitive", () => {
    expect(isSmuEmail("Student@SIS.SMU.EDU.SG")).toBe(true);
  });
  it("trims leading and trailing whitespace", () => {
    expect(isSmuEmail("  student@mitb.smu.edu.sg  ")).toBe(true);
  });
  it("rejects an empty string", () => {
    expect(isSmuEmail("")).toBe(false);
  });
  it("rejects a subdomain spoofing attempt", () => {
    expect(isSmuEmail("student@fake.mitb.smu.edu.sg.evil.com")).toBe(false);
  });
  it("rejects a lookalike domain", () => {
    expect(isSmuEmail("student@fakesmu.edu.sg")).toBe(false);
  });
  it("rejects an email with multiple at signs", () => {
    expect(isSmuEmail("student@gmail.com@smu.edu.sg")).toBe(false);
  });
});
