import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma.js";
import { generateToken } from "../lib/jwt.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { generateVerificationCode, hashCode, verifyCode } from "../lib/verificationCode.js";
import { sendVerificationEmail } from "../lib/email.js";
import { isSmuEmail } from "../utils/isSmuEmail.js";

const router = Router();

const MIN_PASSWORD_LENGTH = 12;

// Validation schemas
const registerRequestSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`),
});

const deleteAccountSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

const verifyEmailSchema = z.object({
  email: z.string().email("Invalid email"),
  code: z.string().length(6, "Code must be 6 digits"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string(),
});

// POST /auth/register/request
router.post("/register/request", async (req, res) => {
  try {
    // Validate input
    const data = registerRequestSchema.parse(req.body);

    // Check if email is SMU email
    if (!isSmuEmail(data.email)) {
      return res.status(400).json({
        error: "Only SMU emails (@smu.edu.sg) are allowed",
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    // Check if pending registration exists
    const existingPending = await prisma.pendingRegistration.findUnique({
      where: { email: data.email },
    });

    if (existingPending && !existingPending.consumedAt) {
      return res.status(400).json({
        error: "Registration already in progress. Check your email for verification code.",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Generate verification code
    const code = generateVerificationCode();
    const codeHash = await hashCode(code);

    // Create pending registration
    await prisma.pendingRegistration.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash,
        codeHash,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        attempts: 0,
      },
    });

    // Send verification email (or log in development)
    await sendVerificationEmail(data.email, code, data.name);

    return res.json({
      message: "Verification code sent to your email",
      email: data.email,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }

    console.error("Registration request error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /auth/register/verify
router.post("/register/verify", async (req, res) => {
  try {
    // Validate input
    const data = verifyEmailSchema.parse(req.body);

    // Find pending registration
    const pending = await prisma.pendingRegistration.findUnique({
      where: { email: data.email },
    });

    if (!pending) {
      return res.status(404).json({ error: "Registration request not found" });
    }

    // Check if already consumed
    if (pending.consumedAt) {
      return res.status(400).json({ error: "This registration has already been verified" });
    }

    // Check if expired
    if (new Date() > pending.expiresAt) {
      return res.status(400).json({ error: "Verification code expired" });
    }

    // Check attempts
    if (pending.attempts >= 5) {
      return res.status(400).json({ error: "Too many failed attempts. Please register again." });
    }

    // Verify code
    const isCodeValid = await verifyCode(data.code, pending.codeHash);

    if (!isCodeValid) {
      // Increment attempts
      await prisma.pendingRegistration.update({
        where: { email: data.email },
        data: { attempts: pending.attempts + 1 },
      });

      return res.status(400).json({ error: "Invalid verification code" });
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: pending.name,
        passwordHash: pending.passwordHash,
        role: "STUDENT",
        emailVerifiedAt: new Date(),
      },
    });

    // Mark pending registration as consumed
    await prisma.pendingRegistration.update({
      where: { email: data.email },
      data: { consumedAt: new Date() },
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }

    console.error("Email verification error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /auth/login
router.post("/login", async (req, res) => {
  try {
    // Validate input
    const data = loginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check if email is verified
    if (!user.emailVerifiedAt) {
      return res.status(403).json({ error: "Email not verified. Please complete registration." });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }

    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /auth/logout
router.post("/logout", requireAuth, async (req, res) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ error: "Missing or invalid authorization token" });
    }

    await prisma.user.update({
      where: { id: req.auth.userId },
      data: { tokenVersion: { increment: 1 } },
    });

    return res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /auth/change-password
router.post("/change-password", requireAuth, async (req, res) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ error: "Missing or invalid authorization token" });
    }

    const data = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.auth.userId },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      return res.status(401).json({ error: "Missing or invalid authorization token" });
    }

    const isCurrentPasswordValid = await bcrypt.compare(data.currentPassword, user.passwordHash);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    const passwordHash = await bcrypt.hash(data.newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, tokenVersion: { increment: 1 } },
    });

    return res.json({ message: "Password changed successfully. Please log in again." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }

    console.error("Change password error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /auth/account
router.delete("/account", requireAuth, async (req, res) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ error: "Missing or invalid authorization token" });
    }

    const data = deleteAccountSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.auth.userId },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      return res.status(401).json({ error: "Missing or invalid authorization token" });
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(400).json({ error: "Password is incorrect" });
    }

    await prisma.user.delete({ where: { id: user.id } });

    return res.json({ message: "Account deleted successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }

    console.error("Delete account error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
