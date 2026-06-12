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

function parseStringList(value: unknown) {
  const values = Array.isArray(value) ? value : value ? [value] : [];

  return values
    .flatMap((item) => String(item).split(","))
    .map((item) => item.trim())
    .filter(Boolean);
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
  const credits = parseStringList(req.query.credits)
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value));
  const schools = parseStringList(req.query.schools);
  const terms = parseStringList(req.query.terms);

  const modules = await prisma.module.findMany({
    where: {
      ...(query
        ? {
            OR: [
              { code: { contains: query, mode: "insensitive" } },
              { name: { contains: query, mode: "insensitive" } },
              { school: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(credits.length > 0 ? { credits: { in: credits } } : {}),
      ...(schools.length > 0 ? { school: { in: schools } } : {}),
      ...(terms.length > 0 ? { termAvailability: { hasSome: terms } } : {}),
    },
    orderBy: { code: "asc" },
  });

  return res.json({ modules });
}));

router.get("/:identifier", asyncHandler(async (req, res) => {
  const identifier = req.params.identifier.trim();

  const module = await prisma.module.findFirst({
    where: {
      OR: [
        { id: identifier },
        { code: { equals: identifier, mode: "insensitive" } },
      ],
    },
  });

  if (!module) {
    return res.status(404).json({ error: "Module could not be found." });
  }

  return res.json({ module });
}));

export default router;
