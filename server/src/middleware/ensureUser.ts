import type { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma.js";

// Mirrors the Keycloak identity into the local `users` table on first authenticated
// hit. Idempotent: subsequent requests upsert based on the `sub` claim.
//
// Must run AFTER requireAuth — depends on `req.auth.payload` being set.

export async function ensureUser(req: Request, _res: Response, next: NextFunction) {
  const payload = (req as unknown as { auth?: { payload: Record<string, unknown> } }).auth?.payload;
  if (!payload) return next(new Error("ensureUser called without req.auth — middleware order bug"));

  const sub = String(payload.sub ?? "");
  const email = String(payload.email ?? "");
  const name = String(payload.name ?? payload.preferred_username ?? email);

  if (!sub || !email) return next(new Error("token missing sub or email claim"));

  await prisma.user.upsert({
    where: { keycloakId: sub },
    update: { email, name },
    create: { keycloakId: sub, email, name },
  });

  next();
}
