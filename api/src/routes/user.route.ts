import { Router } from "express";
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/user.controller";
import { verifyJWT } from "../middleware/auth";
import { checkRole } from "../middleware/role";
import { z } from "zod";
import { validate } from "../middleware/validate";

const router = Router();

// Skema validasi untuk pembuatan user
const createUserSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter").optional(),
  role: z.enum(["super_admin", "admin", "teacher", "student", "guardian"], {
    errorMap: () => ({ message: "Role tidak valid" }),
  }),
});

// Skema validasi untuk update user (semua field opsional)
const updateUserSchema = z.object({
  name: z.string().min(1, "Nama tidak boleh kosong").optional(),
  email: z.string().email("Format email tidak valid").optional(),
  password: z.string().min(6, "Password minimal 6 karakter").optional(),
  role: z.enum(["super_admin", "admin", "teacher", "student", "guardian"]).optional(),
});

// ──────────────────────────────────────────────
// Manajemen Pengguna (Khusus Admin / Super Admin)
// ──────────────────────────────────────────────

// GET /api/users - Ambil semua user
router.get(
  "/",
  verifyJWT,
  checkRole("super_admin", "admin"),
  getAllUsers
);

// POST /api/users - Buat user baru
router.post(
  "/",
  verifyJWT,
  checkRole("super_admin", "admin"),
  validate(createUserSchema),
  createUser
);

// PUT /api/users/:id - Update user
router.put(
  "/:id",
  verifyJWT,
  checkRole("super_admin", "admin"),
  validate(updateUserSchema),
  updateUser
);

// DELETE /api/users/:id - Hapus user
router.delete(
  "/:id",
  verifyJWT,
  checkRole("super_admin", "admin"),
  deleteUser
);

export default router;
