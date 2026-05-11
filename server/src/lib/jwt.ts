import jwt, { type Secret, type SignOptions } from "jsonwebtoken";

export type TokenPayload = {
  userId: string;
  email: string;
  role: string;
};

function readSecret(): Secret {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET must be set");
  return s;
}

const SECRET: Secret = readSecret();
const SIGN_OPTIONS: SignOptions = { expiresIn: "7d" };

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, SECRET, SIGN_OPTIONS);
}

export function verifyJwt(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, SECRET);
    if (typeof decoded === "string") return null;
    return decoded as unknown as TokenPayload;
  } catch {
    return null;
  }
}
