import crypto from "node:crypto";
import bcrypt from "bcryptjs";

// 6-digit numeric code. crypto.randomInt has uniform distribution (vs Math.random).
export function generateCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export async function hashCode(code: string): Promise<string> {
  return bcrypt.hash(code, 10);
}

export async function verifyCode(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}

export const OTP_TTL_MS = 15 * 60 * 1000; // 15 min
export const MAX_ATTEMPTS = 5;
