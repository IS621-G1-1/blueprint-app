import { beforeEach, describe, expect, it, vi } from "vitest";
import { getModuleDetails, searchModulesWithFilters } from "./modules";

const fetchMock = vi.fn();

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("module api helpers", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    localStorage.clear();
  });

  it("builds search URLs from query text and filters", async () => {
    localStorage.setItem("blueprint_token", "token-1");
    fetchMock.mockResolvedValueOnce(jsonResponse({ modules: [] }));

    await searchModulesWithFilters("  security  ", {
      credits: [1, 2],
      schools: ["SCIS"],
      terms: ["Term 1", "Term 2"],
    });

    const [url, options] = fetchMock.mock.calls[0];
    const parsedUrl = new URL(String(url));

    expect(parsedUrl.pathname).toBe("/modules/search");
    expect(parsedUrl.searchParams.get("query")).toBe("security");
    expect(parsedUrl.searchParams.getAll("credits")).toEqual(["1", "2"]);
    expect(parsedUrl.searchParams.getAll("schools")).toEqual(["SCIS"]);
    expect(parsedUrl.searchParams.getAll("terms")).toEqual(["Term 1", "Term 2"]);
    expect(options).toEqual({
      headers: { Authorization: "Bearer token-1" },
    });
  });

  it("encodes module identifiers when fetching details", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        module: {
          id: "module-1",
          code: "IS621",
          name: "Agile and DevSecOps",
          credits: 1,
          termAvailability: [],
        },
      }),
    );

    const module = await getModuleDetails("IS 621/2026");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/modules/IS%20621%2F2026",
      expect.any(Object),
    );
    expect(module.code).toBe("IS621");
  });

  it("uses server error messages when requests fail", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "Module could not be found." }, { status: 404 }));

    await expect(getModuleDetails("missing")).rejects.toThrow("Module could not be found.");
  });
});
