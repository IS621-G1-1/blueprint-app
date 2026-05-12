import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import prisma from "../lib/prisma.js";
import { verifyToken } from "../lib/jwt.js";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid authorization token" });
    }

    const token = authHeader.slice("Bearer ".length).trim();
    const payload = verifyToken(token);

    if (!payload) {
      return res.status(401).json({ error: "Missing or invalid authorization token" });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, tokenVersion: true },
    });

    if (!user || user.tokenVersion !== payload.tokenVersion) {
      return res.status(401).json({ error: "Missing or invalid authorization token" });
    }

    req.auth = {
      userId: user.id,
      role: user.role as Role,
    };

    return next();
  } catch (error) {
    return next(error);
  }
}
