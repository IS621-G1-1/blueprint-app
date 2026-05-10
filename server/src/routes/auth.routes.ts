import { Router, type Request, type Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  KeycloakError,
  createUser,
  passwordGrant,
  refreshToken as refreshKeycloakToken,
  resetUserPassword,
  revokeRefreshToken,
} from "../lib/keycloak.js";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

const refreshSchema = z.object({
  refresh_token: z.string().min(1),
});

const changePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8, "New password must be at least 8 characters"),
});

function tokenResponse(t: { access_token: string; refresh_token: string; expires_in: number; refresh_expires_in: number }) {
  return {
    access_token: t.access_token,
    refresh_token: t.refresh_token,
    expires_in: t.expires_in,
    refresh_expires_in: t.refresh_expires_in,
    token_type: "Bearer",
  };
}

// POST /auth/register
// Creates a Keycloak user (emailVerified=true), mirrors them to Prisma, returns tokens.
router.post("/register", async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const { name, email, password } = parsed.data;

  try {
    const keycloakId = await createUser({ name, email, password });

    // Mirror to local DB up-front so /me works on first login.
    // (ensureUser middleware would do this lazily; we do it eagerly here.)
    await prisma.user.upsert({
      where: { keycloakId },
      update: { email, name },
      create: { keycloakId, email, name },
    });

    // Auto-login after register
    const tokens = await passwordGrant(email, password);
    return res.status(201).json(tokenResponse(tokens));
  } catch (err) {
    if (err instanceof KeycloakError) {
      return res.status(err.status === 409 ? 409 : 400).json({ error: err.message });
    }
    throw err;
  }
});

// POST /auth/login
router.post("/login", async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  try {
    const tokens = await passwordGrant(parsed.data.email, parsed.data.password);
    return res.json(tokenResponse(tokens));
  } catch (err) {
    if (err instanceof KeycloakError) {
      // 401 for any auth failure (don't leak whether email exists)
      return res.status(401).json({ error: "Invalid email or password" });
    }
    throw err;
  }
});

// POST /auth/refresh
router.post("/refresh", async (req: Request, res: Response) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  try {
    const tokens = await refreshKeycloakToken(parsed.data.refresh_token);
    return res.json(tokenResponse(tokens));
  } catch (err) {
    if (err instanceof KeycloakError) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }
    throw err;
  }
});

// POST /auth/logout
router.post("/logout", async (req: Request, res: Response) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  try {
    await revokeRefreshToken(parsed.data.refresh_token);
    return res.status(204).end();
  } catch {
    // Logout is best-effort; even if the token is invalid we tell the caller it's done
    return res.status(204).end();
  }
});

// POST /auth/change-password (authenticated)
// Verifies the current password by re-authenticating, then resets via admin API.
router.post("/change-password", requireAuth, async (req: Request, res: Response) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const payload = (req as unknown as { auth: { payload: { sub: string; email: string } } }).auth.payload;
  const { current_password, new_password } = parsed.data;

  try {
    // Re-auth check: confirm the caller knows the current password
    await passwordGrant(payload.email, current_password);
  } catch {
    return res.status(401).json({ error: "Current password is incorrect" });
  }

  try {
    await resetUserPassword(payload.sub, new_password);
    return res.status(204).end();
  } catch (err) {
    if (err instanceof KeycloakError) return res.status(400).json({ error: err.message });
    throw err;
  }
});

export default router;
