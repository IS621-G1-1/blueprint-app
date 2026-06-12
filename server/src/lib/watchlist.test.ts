import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import {
  addModuleToWatchlist,
  WatchlistDuplicateError,
  WatchlistModuleNotFoundError,
} from "./watchlist.js";

const moduleFixture = {
  id: "11111111-1111-4111-8111-111111111111",
  code: "IS621",
  name: "Agile and DevSecOps",
  credits: 1,
  description: "Practices for iterative delivery.",
  school: "School of Computing and Information Systems",
  prerequisites: null,
  termAvailability: ["Term 1"],
  schedule: "Thu 7:00 PM - 10:15 PM",
  gradingBasis: null,
  examDates: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};

function createDataSource(overrides: {
  module?: unknown;
  existingWatchlistItem?: unknown;
  createdWatchlistItem?: unknown;
}) {
  const module =
    "module" in overrides ? overrides.module : moduleFixture;
  const existingWatchlistItem =
    "existingWatchlistItem" in overrides ? overrides.existingWatchlistItem : null;
  const createdWatchlistItem =
    "createdWatchlistItem" in overrides
      ? overrides.createdWatchlistItem
      : {
          id: "22222222-2222-4222-8222-222222222222",
          userId: "student-1",
          moduleId: moduleFixture.id,
          createdAt: new Date("2026-01-02T00:00:00.000Z"),
          module: moduleFixture,
        };

  return {
    module: {
      findUnique: vi.fn().mockResolvedValue(module),
    },
    watchlistItem: {
      findUnique: vi.fn().mockResolvedValue(existingWatchlistItem),
      create: vi.fn().mockResolvedValue(createdWatchlistItem),
    },
  } as unknown as Pick<PrismaClient, "module" | "watchlistItem">;
}

describe("addModuleToWatchlist", () => {
  it("adds a module to the student's watchlist", async () => {
    const dataSource = createDataSource({});

    const watchlistItem = await addModuleToWatchlist(
      dataSource,
      "student-1",
      moduleFixture.id,
    );

    expect(dataSource.module.findUnique).toHaveBeenCalledWith({
      where: { id: moduleFixture.id },
    });
    expect(dataSource.watchlistItem.findUnique).toHaveBeenCalledWith({
      where: {
        userId_moduleId: {
          userId: "student-1",
          moduleId: moduleFixture.id,
        },
      },
      include: {
        module: true,
      },
    });
    expect(dataSource.watchlistItem.create).toHaveBeenCalledWith({
      data: {
        userId: "student-1",
        moduleId: moduleFixture.id,
      },
      include: {
        module: true,
      },
    });
    expect(watchlistItem.module.code).toBe("IS621");
  });

  it("rejects duplicate modules already in the watchlist", async () => {
    const existingWatchlistItem = {
      id: "33333333-3333-4333-8333-333333333333",
      userId: "student-1",
      moduleId: moduleFixture.id,
      createdAt: new Date("2026-01-03T00:00:00.000Z"),
      module: moduleFixture,
    };
    const dataSource = createDataSource({ existingWatchlistItem });

    await expect(
      addModuleToWatchlist(dataSource, "student-1", moduleFixture.id),
    ).rejects.toBeInstanceOf(WatchlistDuplicateError);
    expect(dataSource.watchlistItem.create).not.toHaveBeenCalled();
  });

  it("rejects missing modules", async () => {
    const dataSource = createDataSource({ module: null });

    await expect(
      addModuleToWatchlist(dataSource, "student-1", moduleFixture.id),
    ).rejects.toBeInstanceOf(WatchlistModuleNotFoundError);
    expect(dataSource.watchlistItem.findUnique).not.toHaveBeenCalled();
    expect(dataSource.watchlistItem.create).not.toHaveBeenCalled();
  });
});
