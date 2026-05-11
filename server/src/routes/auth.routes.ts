import { Router, type Request, type Response } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma.js";
import { generateToken } from "../lib/jwt.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { sendOtpEmail } from "../lib/email.js";
import { MAX_ATTEMPTS, OTP_TTL_MS, generateCode, hashCode, verifyCode } from "../lib/otp.js";

const router = Router();

const registerRequestSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const registerVerifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, "Code must be 6 digits"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const changePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8, "New password must be at least 8 characters"),
});

function tokenResponse(user: { id: string; email: string; name: string; role: string }) {
  return {
    access_token: generateToken({ userId: user.id, email: user.email, role: user.role }),
    token_type: "Bearer",
    expires_in: 7 * 24 * 60 * 60,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  };
}

// POST /auth/register/request — create pending registration, send OTP email
router.post("/register/request", async (req: Request, res: Response) => {
  const parsed = registerRequestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "Email is already registered" });

  // If there's a pending row that hasn't been consumed, overwrite it (lets the
  // user re-trigger the flow with a fresh code without manually clearing state).
  const passwordHash = await bcrypt.hash(password, 10);
  const code = generateCode();
  const codeHash = await hashCode(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.pendingRegistration.upsert({
    where: { email },
    create: { email, name, passwordHash, codeHash, expiresAt, attempts: 0 },
    update: { name, passwordHash, codeHash, expiresAt, attempts: 0, consumedAt: null },
  });

  await sendOtpEmail(email, name, code);

  return res.json({ message: "Verification code sent", email });
});

// POST /auth/register/verify — validate OTP, create user row, return JWT
router.post("/register/verify", async (req: Request, res: Response) => {
  const parsed = registerVerifySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const { email, code } = parsed.data;
  const pending = await prisma.pendingRegistration.findUnique({ where: { email } });

  if (!pending) return res.status(404).json({ error: "No registration in progress for this email" });
  if (pending.consumedAt) return res.status(400).json({ error: "This registration was already verified" });
  if (new Date() > pending.expiresAt) return res.status(400).json({ error: "Verification code expired" });
  if (pending.attempts >= MAX_ATTEMPTS) {
    return res.status(400).json({ error: "Too many failed attempts. Please request a new code." });
  }

  const ok = await verifyCode(code, pending.codeHash);
  if (!ok) {
    await prisma.pendingRegistration.update({
      where: { email },
      data: { attempts: { increment: 1 } },
    });
    return res.status(400).json({ error: "Invalid verification code" });
  }

  const user = await prisma.user.create({
    data: {
      email,
      name: pending.name,
      passwordHash: pending.passwordHash,
      emailVerifiedAt: new Date(),
    },
    select: { id: true, email: true, name: true, role: true },
  });

  await prisma.pendingRegistration.update({
    where: { email },
    data: { consumedAt: new Date() },
  });

  return res.status(201).json(tokenResponse(user));
});

// POST /auth/login
router.post("/login", async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) return res.status(401).json({ error: "Invalid email or password" });
  if (!user.emailVerifiedAt) return res.status(403).json({ error: "Email not verified" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid email or password" });

  return res.json(
    tokenResponse({ id: user.id, email: user.email, name: user.name, role: user.role })
  );
});

// POST /auth/change-password — authed; verifies current pw before updating
router.post("/change-password", requireAuth, async (req: Request, res: Response) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
  if (!user) return res.status(404).json({ error: "User not found" });

  const ok = await bcrypt.compare(parsed.data.current_password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Current password is incorrect" });

  const newHash = await bcrypt.hash(parsed.data.new_password, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } });

  return res.status(204).end();
});

// POST /auth/logout — stateless JWT, so this is just a client signal. Tokens
// remain valid until expiry (or rotate JWT_SECRET to invalidate all sessions).
router.post("/logout", (_req, res) => res.status(204).end());

export default router;
