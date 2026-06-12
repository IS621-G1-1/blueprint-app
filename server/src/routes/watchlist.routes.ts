import { Router } from "express";
import type { Request } from "express";
import type { NextFunction, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import {
  addModuleToWatchlist,
  removeModuleFromWatchlist,
  WatchlistDuplicateError,
  WatchlistItemNotFoundError,
  WatchlistModuleNotFoundError,
} from "../lib/watchlist.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

const addWatchlistItemSchema = z.object({
  moduleId: z.string().uuid("Module is required"),
});

const watchlistItemParamsSchema = z.object({
  watchlistItemId: z.string().uuid("Watchlist item is required"),
});

function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    void handler(req, res, next).catch(next);
  };
}

function getAuth(req: Request) {
  if (!req.auth) {
    throw new Error("Authenticated route missing auth context");
  }

  return req.auth;
}

router.use(requireAuth);

router.get("/", asyncHandler(async (req, res) => {
  const auth = getAuth(req);
  const watchlistItems = await prisma.watchlistItem.findMany({
    where: { userId: auth.userId },
    include: { module: true },
    orderBy: { createdAt: "desc" },
  });

  return res.json({ watchlistItems });
}));

router.post("/", asyncHandler(async (req, res) => {
  try {
    const auth = getAuth(req);
    const data = addWatchlistItemSchema.parse(req.body);
    const watchlistItem = await addModuleToWatchlist(prisma, auth.userId, data.moduleId);

    return res.status(201).json({
      message: "Module added to watchlist",
      watchlistItem,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }

    if (error instanceof WatchlistModuleNotFoundError) {
      return res.status(404).json({ error: error.message });
    }

    if (error instanceof WatchlistDuplicateError) {
      return res.status(409).json({
        error: error.message,
        watchlistItem: error.watchlistItem,
      });
    }

    throw error;
  }
}));

router.delete("/:watchlistItemId", asyncHandler(async (req, res) => {
  try {
    const auth = getAuth(req);
    const params = watchlistItemParamsSchema.parse(req.params);

    await removeModuleFromWatchlist(prisma, auth.userId, params.watchlistItemId);

    return res.json({ message: "Module removed from watchlist" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }

    if (error instanceof WatchlistItemNotFoundError) {
      return res.status(404).json({ error: error.message });
    }

    throw error;
  }
}));

export default router;
