"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const jwt_1 = require("../lib/jwt");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// ──────────────────────────────────────────────
// Validation Schemas
// ──────────────────────────────────────────────
const loginSchema = zod_1.z.object({
    identifier: zod_1.z.string().min(1, "Email / NIS / NIP wajib diisi"),
    password: zod_1.z.string().min(1, "Password wajib diisi"),
});
const changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, "Password saat ini wajib diisi"),
    newPassword: zod_1.z
        .string()
        .min(8, "Password minimal 8 karakter")
        .regex(/[A-Z]/, "Password harus mengandung minimal 1 huruf besar")
        .regex(/[0-9]/, "Password harus mengandung minimal 1 angka"),
});
// ──────────────────────────────────────────────
// POST /api/auth/login
// Menerima email & password, mengembalikan JWT + data user beserta role
// ──────────────────────────────────────────────
router.post("/login", (0, validate_1.validate)(loginSchema), async (req, res) => {
    try {
        const { identifier, password } = req.body;
        // Cari user berdasarkan email ATAU nipNis
        const user = await prisma_1.prisma.user.findFirst({
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
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({
                success: false,
                message: "Email atau password salah",
            });
            return;
        }
        // Generate JWT token dengan payload berisi id dan role
        const token = (0, jwt_1.signToken)({ id: user.id, role: user.role });
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
    }
    catch (error) {
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
router.get("/me", auth_1.verifyJWT, async (req, res) => {
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.id },
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
                },
                guardian: {
                    select: {
                        id: true,
                        students: {
                            select: {
                                id: true,
                                name: true,
                                class: { select: { id: true, name: true } }
                            }
                        }
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
    }
    catch (error) {
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
router.put("/change-password", auth_1.verifyJWT, (0, validate_1.validate)(changePasswordSchema), async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.id },
        });
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User tidak ditemukan",
            });
            return;
        }
        // Verifikasi password saat ini
        const isCurrentPasswordValid = await bcryptjs_1.default.compare(currentPassword, user.password);
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
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        await prisma_1.prisma.user.update({
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
    }
    catch (error) {
        console.error("[Auth] Change password error:", error);
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server",
        });
    }
});
// ──────────────────────────────────────────────
// PATCH /api/auth/change-password
// Alias — menerima oldPassword ATAU currentPassword
// ──────────────────────────────────────────────
router.patch("/change-password", auth_1.verifyJWT, async (req, res) => {
    try {
        const body = req.body;
        const oldPassword = body.oldPassword ?? body.currentPassword;
        const newPassword = body.newPassword;
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
        const user = await prisma_1.prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) {
            res.status(404).json({ success: false, message: "User tidak ditemukan" });
            return;
        }
        const isValid = await bcryptjs_1.default.compare(oldPassword, user.password);
        if (!isValid) {
            res.status(400).json({ success: false, message: "Password lama tidak sesuai" });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                force_change_password: false,
            },
        });
        res.json({ success: true, message: "Password berhasil diubah" });
    }
    catch (error) {
        console.error("[Auth] PATCH Change password error:", error);
        res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
    }
});
exports.default = router;
//# sourceMappingURL=auth.route.js.map