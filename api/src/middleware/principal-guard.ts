import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";

/**
 * Middleware untuk memblokir aksi mutasi (POST, PUT, DELETE) 
 * khusus untuk role KEPALA_SEKOLAH.
 */
export const readOnlyKepalaSekolah = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Pastikan user sudah terautentikasi
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Autentikasi diperlukan."
    });
  }

  const role = req.user.role.toLowerCase();

  // Jika login sebagai KEPALA_SEKOLAH dan metodenya bukan GET
  if (
    (role === "kepala_sekolah" || role === "principal") &&
    req.method !== "GET"
  ) {
    // Kecualikan route export jika ada
    if (!req.originalUrl.toLowerCase().includes("/export")) {
      return res.status(403).json({
        success: false,
        message: "Kepala sekolah hanya memiliki akses read-only"
      });
    }
  }

  next();
};
