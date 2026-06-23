import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  addModuleToSemesterPlan,
  createOrLoadSemesterPlan,
  removeModuleFromSemesterPlan,
} from "./semesterPlans";

const fetchMock = vi.fn();

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("semester plan api helpers", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    localStorage.clear();
  });

  it("creates or loads a semester plan with the selected year and term", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: "ready", semesterPlan: { id: "plan-1" } }));

    await createOrLoadSemesterPlan({ year: 2026, term: "Term 1" });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/semester-plans",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ year: 2026, term: "Term 1" }),
      }),
    );
  });

  it("posts module IDs to a semester plan", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: "added", semesterPlan: { id: "plan-1" } }));

    await addModuleToSemesterPlan("plan-1", "module-1");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/semester-plans/plan-1/modules",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ moduleId: "module-1" }),
      }),
    );
  });

  it("deletes planned modules from the selected semester plan", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: "removed" }));

    await removeModuleFromSemesterPlan("plan-1", "planned-module-1");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/semester-plans/plan-1/modules/planned-module-1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
