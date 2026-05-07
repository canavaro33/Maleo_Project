import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { signToken } from "../lib/jwt";
import { validate } from "../middleware/validate";
import { verifyJWT, AuthRequest } from "../middleware/auth";

const router = Router();

// ──────────────────────────────────────────────
// Validation Schemas
// ──────────────────────────────────────────────

const loginSchema = z.object({
  identifier: z.string().min(1, "Email / NIS / NIP wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
  newPassword: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .regex(/[A-Z]/, "Password harus mengandung minimal 1 huruf besar")
    .regex(/[0-9]/, "Password harus mengandung minimal 1 angka"),
});

// ──────────────────────────────────────────────
// POST /api/auth/login
// Menerima email & password, mengembalikan JWT + data user beserta role
// ──────────────────────────────────────────────
router.post("/login", validate(loginSchema), async (req, res: Response) => {
  try {
    const { identifier, password } = req.body as z.infer<typeof loginSchema>;

    // Cari user berdasarkan email ATAU nipNis
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { nipNis: identifier },
        ],
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Email / NIS / NIP atau password salah",
      });
      return;
    }

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Email atau password salah",
      });
      return;
    }

    // Generate JWT token dengan payload berisi id dan role
    const token = signToken({ id: user.id, role: user.role });

    // Response berhasil — sertakan force_change_password
    res.json({
      success: true,
      message: "Login berhasil",
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          nipNis: user.nipNis,
          role: user.role,
          force_change_password: user.force_change_password,
        },
      },
    });
  } catch (error) {
    console.error("[Auth] Login error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server. Silakan coba lagi nanti.",
    });
  }
});

// ──────────────────────────────────────────────
// GET /api/auth/me
// Mengambil data user yang sedang login berdasarkan JWT token
// ──────────────────────────────────────────────
router.get("/me", verifyJWT, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        force_change_password: true,
        createdAt: true,
        teacher: {
          select: {
            id: true,
            subjects: { select: { id: true, name: true, code: true } },
            homeroomClasses: { select: { id: true, name: true, level: true } }
          }
        },
        student: {
          select: {
            id: true,
            class: { select: { id: true, name: true } }
          }
        }
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
      return;
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error("[Auth] Me error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
    });
  }
});

// ──────────────────────────────────────────────
// PUT /api/auth/change-password
// Mengubah password user yang sedang login
// ──────────────────────────────────────────────
router.put(
  "/change-password",
  verifyJWT,
  validate(changePasswordSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body as z.infer<typeof changePasswordSchema>;

      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: "User tidak ditemukan",
        });
        return;
      }

      // Verifikasi password saat ini
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        res.status(400).json({
          success: false,
          message: "Password lama tidak sesuai",
        });
        return;
      }

      // Password baru tidak boleh sama dengan lama
      if (currentPassword === newPassword) {
        res.status(400).json({
          success: false,
          message: "Password baru tidak boleh sama dengan password lama",
        });
        return;
      }

      // Hash password baru dan simpan
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          force_change_password: false,
        },
      });

      res.json({
        success: true,
        message: "Password berhasil diubah",
      });
    } catch (error) {
      console.error("[Auth] Change password error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
      });
    }
  }
);

// ──────────────────────────────────────────────
// PATCH /api/auth/change-password
// Alias — menerima oldPassword ATAU currentPassword
// ──────────────────────────────────────────────
router.patch(
  "/change-password",
  verifyJWT,
  async (req: AuthRequest, res: Response) => {
    try {
      const body = req.body as any;
      const oldPassword: string | undefined = body.oldPassword ?? body.currentPassword;
      const newPassword: string | undefined = body.newPassword;

      // Validasi manual
      if (!oldPassword || !newPassword) {
        res.status(400).json({ success: false, message: "oldPassword dan newPassword wajib diisi" });
        return;
      }
      if (newPassword.length < 8) {
        res.status(400).json({ success: false, message: "Password minimal 8 karakter" });
        return;
      }
      if (oldPassword === newPassword) {
        res.status(400).json({ success: false, message: "Password baru tidak boleh sama dengan password lama" });
        return;
      }

      const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
      if (!user) {
        res.status(404).json({ success: false, message: "User tidak ditemukan" });
        return;
      }

      const isValid = await bcrypt.compare(oldPassword, user.password);
      if (!isValid) {
        res.status(400).json({ success: false, message: "Password lama tidak sesuai" });
        return;
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          force_change_password: false,
        },
      });

      res.json({ success: true, message: "Password berhasil diubah" });
    } catch (error) {
      console.error("[Auth] PATCH Change password error:", error);
      res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
    }
  }
);

export default router;
