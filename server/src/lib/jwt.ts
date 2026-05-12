import jwt from "jsonwebtoken";

interface TokenPayload {
  userId: string;
  email: string;
  role?: string;
}

const SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, SECRET) as TokenPayload;
  } catch {
    return null;
  }
}
