import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    void handler(req, res, next).catch(next);
  };
}

router.use(requireAuth);

router.get("/", asyncHandler(async (_req, res) => {
  const modules = await prisma.module.findMany({
    orderBy: { code: "asc" },
  });

  return res.json({ modules });
}));

router.get("/search", asyncHandler(async (req, res) => {
  const query = typeof req.query.query === "string" ? req.query.query.trim() : "";

  const modules = await prisma.module.findMany({
    where: query
      ? {
          OR: [
            { code: { contains: query, mode: "insensitive" } },
            { name: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { code: "asc" },
  });

  return res.json({ modules });
}));

export default router;
