import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.auth!.userId },
    select: { id: true, email: true, name: true, role: true, createdAt: true, emailVerifiedAt: true },
  });
  if (!user) return res.status(404).json({ error: "User not found" });

  return res.json(user);
});

export default router;
