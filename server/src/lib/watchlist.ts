import type { Module, WatchlistItem } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";

export type WatchlistItemWithModule = WatchlistItem & {
  module: Module;
};

type WatchlistDataSource = Pick<PrismaClient, "module" | "watchlistItem">;

export class WatchlistDuplicateError extends Error {
  watchlistItem: WatchlistItemWithModule;

  constructor(watchlistItem: WatchlistItemWithModule) {
    super("This module is already in your watchlist");
    this.name = "WatchlistDuplicateError";
    this.watchlistItem = watchlistItem;
  }
}

export class WatchlistModuleNotFoundError extends Error {
  constructor() {
    super("Module not found");
    this.name = "WatchlistModuleNotFoundError";
  }
}

export async function addModuleToWatchlist(
  dataSource: WatchlistDataSource,
  userId: string,
  moduleId: string,
) {
  const module = await dataSource.module.findUnique({
    where: { id: moduleId },
  });

  if (!module) {
    throw new WatchlistModuleNotFoundError();
  }

  const existingWatchlistItem = await dataSource.watchlistItem.findUnique({
    where: {
      userId_moduleId: {
        userId,
        moduleId,
      },
    },
    include: {
      module: true,
    },
  });

  if (existingWatchlistItem) {
    throw new WatchlistDuplicateError(existingWatchlistItem);
  }

  return dataSource.watchlistItem.create({
    data: {
      userId,
      moduleId,
    },
    include: {
      module: true,
    },
  });
}
