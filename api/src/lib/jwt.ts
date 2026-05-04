import jwt, { SignOptions } from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "fallback_secret";
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export interface JwtPayload {
  id: number;
  role: string;
}

export function signToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: EXPIRES_IN as jwt.SignOptions["expiresIn"],
  };
  return jwt.sign(payload, SECRET, options);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET) as JwtPayload;
}
