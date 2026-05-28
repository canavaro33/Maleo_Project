"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const auth_1 = require("../middleware/auth");
const role_1 = require("../middleware/role");
const validate_1 = require("../middleware/validate");
const userCode_1 = require("../lib/userCode");
const router = (0, express_1.Router)();
const studentSchema = zod_1.z.object({
    nis: zod_1.z.string().min(1, "NIS wajib diisi"),
    name: zod_1.z.string().min(1, "Nama wajib diisi"),
    gender: zod_1.z.enum(["L", "P"]),
    birthDate: zod_1.z.string().min(1, "Tanggal lahir wajib diisi"),
    address: zod_1.z.string().min(1, "Alamat wajib diisi").optional().or(zod_1.z.literal("")),
    phone: zod_1.z.string().min(1, "Telepon wajib diisi").optional().or(zod_1.z.literal("")),
    classId: zod_1.z.coerce.number().int().positive("Kelas harus dipilih"),
    status: zod_1.z.enum(["active", "inactive"]).optional(),
});
// GET /api/students
router.get("/", auth_1.verifyJWT, async (req, res) => {
    try {
        const { search, className } = req.query;
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: String(search), mode: "insensitive" } },
                { nis: { contains: String(search) } },
            ];
        }
        if (className) {
            where.class = { name: String(className) };
        }
        const students = await prisma_1.prisma.student.findMany({
            where,
            include: {
                class: { select: { id: true, name: true } },
                guardians: { select: { id: true, name: true } },
                user: { select: { userCode: true } },
            },
            orderBy: { name: "asc" },
        });
        // Ambil userCode via relasi user pada student
        const result = students.map((s) => ({
            id: s.id,
            nis: s.nis,
            name: s.name,
            gender: s.gender,
            birthDate: s.birthDate ? s.birthDate.toISOString().split("T")[0] : null,
            address: s.address,
            phone: s.phone,
            classId: s.classId,
            className: s.class.name,
            status: s.status,
            userCode: s.user?.userCode || null,
            guardians: s.guardians.map((g) => ({ id: g.id, name: g.name })),
        }));
        res.json({ success: true, data: result, total: result.length });
    }
    catch (error) {
        console.error("[Students] GET error:", error);
        res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
    }
});
// GET /api/students/:id
router.get("/:id", auth_1.verifyJWT, async (req, res) => {
    try {
        const student = await prisma_1.prisma.student.findUnique({
            where: { id: Number(req.params.id) },
            include: {
                class: { select: { id: true, name: true } },
                guardians: { select: { id: true, name: true, phone: true, email: true } },
            },
        });
        if (!student) {
            res.status(404).json({ success: false, message: "Siswa tidak ditemukan" });
            return;
        }
        res.json({ success: true, data: student });
    }
    catch (error) {
        console.error("[Students] GET by ID error:", error);
        res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
    }
});
// POST /api/students
router.post("/", auth_1.verifyJWT, (0, role_1.checkRole)("admin"), (0, validate_1.validate)(studentSchema), async (req, res) => {
    try {
        const data = req.body;
        const { nis, name } = data;
        // 1. Generate unique 3-digit userCode otomatis
        const userCode = await (0, userCode_1.generateUniqueUserCode)("student");
        // 2. Generate Default Password (e.g. S001)
        const defaultPassword = `S${userCode}`;
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(defaultPassword, salt);
        // 3. Transaction: buat Student dulu, dapat id-nya, baru buat User dengan studentId FK
        const result = await prisma_1.prisma.$transaction(async (tx) => {
            // Buat Profil Student terlebih dahulu
            const student = await tx.student.create({
                data: {
                    ...data,
                    birthDate: new Date(data.birthDate),
                },
            });
            // Buat Akun User dengan FK studentId
            await tx.user.create({
                data: {
                    name,
                    nipNis: nis,
                    userCode,
                    password: hashedPassword,
                    role: "student",
                    studentId: student.id,
                },
            });
            return { student };
        });
        res.status(201).json({
            success: true,
            message: `Siswa berhasil ditambahkan. Akun login otomatis dibuat dengan Password: ${defaultPassword}`,
            data: result.student
        });
    }
    catch (error) {
        if (error.code === "P2002") {
            res.status(400).json({ success: false, message: "NIS sudah digunakan di sistem" });
            return;
        }
        console.error("[Students] POST error:", error);
        res.status(500).json({ success: false, message: "Terjadi kesalahan server saat membuat data siswa" });
    }
});
// PUT /api/students/:id
router.put("/:id", auth_1.verifyJWT, (0, role_1.checkRole)("admin"), (0, validate_1.validate)(studentSchema.partial()), async (req, res) => {
    try {
        const data = req.body;
        if (data.birthDate)
            data.birthDate = new Date(data.birthDate);
        const student = await prisma_1.prisma.student.update({
            where: { id: Number(req.params.id) },
            data,
        });
        res.json({ success: true, message: "Siswa berhasil diperbarui", data: student });
    }
    catch (error) {
        if (error.code === "P2025") {
            res.status(404).json({ success: false, message: "Siswa tidak ditemukan" });
            return;
        }
        res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
    }
});
// DELETE /api/students/:id
router.delete("/:id", auth_1.verifyJWT, (0, role_1.checkRole)("admin"), async (req, res) => {
    try {
        await prisma_1.prisma.$transaction(async (tx) => {
            const studentId = Number(req.params.id);
            // Hapus akun user yang terkait dengan siswa ini agar tidak ada yatim piatu
            await tx.user.deleteMany({ where: { studentId } });
            // Hapus data siswa
            await tx.student.delete({ where: { id: studentId } });
        });
        res.json({ success: true, message: "Siswa beserta akun loginnya berhasil dihapus" });
    }
    catch (error) {
        if (error.code === "P2025") {
            res.status(404).json({ success: false, message: "Siswa tidak ditemukan" });
            return;
        }
        res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
    }
});
exports.default = router;
//# sourceMappingURL=students.route.js.map