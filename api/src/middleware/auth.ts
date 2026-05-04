import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { verifyToken, JwtPayload } from "../lib/jwt";

/**
 * Extends Express Request dengan data user yang sudah terautentikasi.
 * Properti `user` tersedia setelah middleware `verifyJWT` dijalankan.
 */
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

/**
 * Middleware untuk memverifikasi JWT token dari header Authorization.
 * Format: `Authorization: Bearer <token>`
 *
 * Jika valid, `req.user` akan terisi dengan payload { id, role }.
 */
export const verifyJWT = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Token tidak ditemukan. Silakan login terlebih dahulu.",
    });
    return;
  }

  const token = header.split(" ")[1];

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    // Bedakan antara token expired dan token invalid
    const isExpired = error instanceof Error && error.name === "TokenExpiredError";
    res.status(401).json({
      success: false,
      message: isExpired
        ? "Token sudah kadaluarsa. Silakan login kembali."
        : "Token tidak valid.",
    });
  }
};
