import type { NextFunction, Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { verifyJwt } from "../lib/jwt.js";

// Verifies a Bearer JWT signed by us, looks up the user, attaches `req.auth`.
// Replaces the prior bearer middleware that validated Keycloak JWTs against JWKS.

declare module "express-serve-static-core" {
  interface Request {
    auth?: {
      userId: string;
      email: string;
      role: string;
    };
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.header("Authorization");
    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid authorization token" });
    }

    const token = header.slice("Bearer ".length).trim();
    const payload = verifyJwt(token);
    if (!payload) {
      return res.status(401).json({ error: "Missing or invalid authorization token" });
    }

    // Re-fetch the user so a deleted/disabled account immediately stops working.
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true },
    });
    if (!user) {
      return res.status(401).json({ error: "Missing or invalid authorization token" });
    }

    req.auth = { userId: user.id, email: user.email, role: user.role };
    return next();
  } catch (err) {
    return next(err);
  }
}
