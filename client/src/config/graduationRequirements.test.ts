import { describe, expect, it } from "vitest";
import {
  type GraduationRequirementCategory,
  getRequirementStatus,
} from "./graduationRequirements";

function makeCategory(taken: string[], requiredCount: number): GraduationRequirementCategory {
  return { id: "test", name: "Test", requiredCount, taken, remaining: [] };
}

describe("getRequirementStatus", () => {
  it("returns Fulfilled when taken equals requiredCount", () => {
    expect(getRequirementStatus(makeCategory(["A", "B", "C"], 3))).toBe("Fulfilled");
  });
  it("returns Fulfilled when taken exceeds requiredCount", () => {
    expect(getRequirementStatus(makeCategory(["A", "B", "C"], 2))).toBe("Fulfilled");
  });
  it("returns Unfulfilled when taken is below requiredCount", () => {
    expect(getRequirementStatus(makeCategory(["A"], 3))).toBe("Unfulfilled");
  });
  it("returns Unfulfilled when no modules are taken", () => {
    expect(getRequirementStatus(makeCategory([], 1))).toBe("Unfulfilled");
  });
});
