import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { ensureUser } from "../middleware/ensureUser.js";

const router = Router();

router.get("/", requireAuth, ensureUser, async (req, res) => {
  const sub = String((req as unknown as { auth: { payload: { sub: string } } }).auth.payload.sub);

  const user = await prisma.user.findUnique({ where: { keycloakId: sub } });
  if (!user) return res.status(404).json({ error: "user not found after upsert" });

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    keycloakId: user.keycloakId,
    createdAt: user.createdAt,
  });
});

export default router;
