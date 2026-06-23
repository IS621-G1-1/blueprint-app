import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  addModuleToWatchlist,
  getWatchlist,
  removeModuleFromWatchlist,
} from "./watchlist";

const fetchMock = vi.fn();

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("watchlist api helpers", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    localStorage.clear();
  });

  it("returns watchlist items from the API response", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        watchlistItems: [
          {
            id: "watchlist-1",
            userId: "user-1",
            moduleId: "module-1",
            createdAt: "2026-01-01T00:00:00.000Z",
            module: { id: "module-1", code: "IS621", name: "Agile and DevSecOps", credits: 1 },
          },
        ],
      }),
    );

    const items = await getWatchlist();

    expect(items).toHaveLength(1);
    expect(items[0].module.code).toBe("IS621");
  });

  it("posts module IDs when adding to the watchlist", async () => {
    localStorage.setItem("blueprint_token", "token-1");
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: "added", watchlistItem: { id: "watchlist-1" } }));

    await addModuleToWatchlist("module-1");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/watchlist",
      expect.objectContaining({
        method: "POST",
        headers: {
          Authorization: "Bearer token-1",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ moduleId: "module-1" }),
      }),
    );
  });

  it("encodes watchlist item IDs before deleting", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: "removed" }));

    await removeModuleFromWatchlist("watch/item 1");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/watchlist/watch%2Fitem%201",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
