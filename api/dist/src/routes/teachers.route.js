"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const role_1 = require("../middleware/role");
const validate_1 = require("../middleware/validate");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userCode_1 = require("../lib/userCode");
const router = (0, express_1.Router)();
const teacherSchema = zod_1.z.object({
    nip: zod_1.z.string().min(1, "NIP wajib diisi"),
    name: zod_1.z.string().min(1, "Nama wajib diisi"),
    gender: zod_1.z.enum(["L", "P"]),
    email: zod_1.z.string().email("Email tidak valid"),
    phone: zod_1.z.string().min(1, "Telepon wajib diisi"),
    subject: zod_1.z.string().optional().or(zod_1.z.literal("")),
    subjectIds: zod_1.z.array(zod_1.z.number()).optional(),
    status: zod_1.z.enum(["active", "inactive"]).optional(),
});
// GET /api/teachers
router.get("/", auth_1.verifyJWT, async (req, res) => {
    try {
        const { search } = req.query;
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: String(search), mode: "insensitive" } },
                { nip: { contains: String(search) } },
                { subject: { contains: String(search), mode: "insensitive" } },
            ];
        }
        const teachers = await prisma_1.prisma.teacher.findMany({
            where,
            include: { user: { select: { userCode: true } }, subjects: { select: { id: true, name: true } } },
            orderBy: { name: "asc" },
        });
        const result = teachers.map((t) => ({
            ...t,
            userCode: t.user?.userCode || null,
        }));
        res.json({ data: result, total: teachers.length });
    }
    catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan server" });
    }
});
// GET /api/teachers/:id
router.get("/:id", auth_1.verifyJWT, async (req, res) => {
    try {
        const teacher = await prisma_1.prisma.teacher.findUnique({
            where: { id: Number(req.params.id) },
            include: { subjects: { select: { id: true, name: true } } }
        });
        if (!teacher) {
            res.status(404).json({ message: "Guru tidak ditemukan" });
            return;
        }
        res.json({ data: teacher });
    }
    catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan server" });
    }
});
// POST /api/teachers
router.post("/", auth_1.verifyJWT, (0, role_1.checkRole)("admin"), (0, validate_1.validate)(teacherSchema), async (req, res) => {
    try {
        const { nip, name, email, subjectIds, ...restData } = req.body;
        const data = { nip, name, email, ...restData };
        // 1. Generate unique 3-digit userCode otomatis
        const userCode = await (0, userCode_1.generateUniqueUserCode)("teacher");
        // 2. Generate default password (e.g. G001)
        const defaultPassword = `G${userCode}`;
        // Hash password
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(defaultPassword, salt);
        // 3. Transaction: buat Teacher dulu, dapat id-nya, baru buat User dengan teacherId FK
        const result = await prisma_1.prisma.$transaction(async (tx) => {
            const teacher = await tx.teacher.create({
                data: {
                    ...data,
                    subjects: subjectIds ? { connect: subjectIds.map((id) => ({ id })) } : undefined
                }
            });
            await tx.user.create({
                data: {
                    name,
                    email,
                    nipNis: nip,
                    userCode,
                    password: hashedPassword,
                    role: "teacher",
                    teacherId: teacher.id,
                },
            });
            return { teacher };
        });
        res.status(201).json({
            success: true,
            message: `Guru berhasil ditambahkan. Akun login otomatis dibuat dengan Password: ${defaultPassword}`,
            data: result.teacher
        });
    }
    catch (error) {
        if (error.code === "P2002") {
            res.status(400).json({ success: false, message: "NIP atau email sudah digunakan" });
            return;
        }
        console.error("[Teachers] POST error:", error);
        res.status(500).json({ success: false, message: "Terjadi kesalahan server saat membuat data guru" });
    }
});
// PUT /api/teachers/:id
router.put("/:id", auth_1.verifyJWT, (0, role_1.checkRole)("admin"), (0, validate_1.validate)(teacherSchema.partial()), async (req, res) => {
    try {
        const { subjectIds, ...data } = req.body;
        const updateData = { ...data };
        if (subjectIds) {
            updateData.subjects = { set: subjectIds.map((id) => ({ id })) };
        }
        const teacher = await prisma_1.prisma.teacher.update({
            where: { id: Number(req.params.id) },
            data: updateData
        });
        res.json({ message: "Guru berhasil diperbarui", data: teacher });
    }
    catch (error) {
        if (error.code === "P2025") {
            res.status(404).json({ message: "Guru tidak ditemukan" });
            return;
        }
        res.status(500).json({ message: "Terjadi kesalahan server" });
    }
});
// DELETE /api/teachers/:id
router.delete("/:id", auth_1.verifyJWT, (0, role_1.checkRole)("admin"), async (req, res) => {
    try {
        const id = Number(req.params.id);
        // 1. Pengecekan Relasi (Safe Delete)
        const [hasSubjects, hasSchedules, hasHomeroom] = await Promise.all([
            prisma_1.prisma.subject.findFirst({ where: { teacherId: id } }),
            prisma_1.prisma.schedule.findFirst({ where: { teacherId: id } }),
            prisma_1.prisma.class.findFirst({ where: { homeroomTeacherId: id } }),
        ]);
        if (hasSubjects || hasSchedules || hasHomeroom) {
            return res.status(400).json({
                success: false,
                message: "Tidak dapat menghapus data: Guru yang bersangkutan masih memiliki beban mengajar atau terdaftar sebagai Wali Kelas. Silakan kosongkan atau pindahkan data terlebih dahulu."
            });
        }
        // 2. Hapus data secara transaksional
        await prisma_1.prisma.$transaction(async (tx) => {
            // Hapus akun user yang terkait dengan guru ini
            await tx.user.deleteMany({ where: { teacherId: id } });
            // Hapus data guru
            await tx.teacher.delete({ where: { id } });
        });
        res.json({ success: true, message: "Guru beserta akun loginnya berhasil dihapus" });
    }
    catch (error) {
        if (error.code === "P2025") {
            res.status(404).json({ success: false, message: "Guru tidak ditemukan" });
            return;
        }
        console.error("[Teachers] DELETE error:", error);
        res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
    }
});
exports.default = router;
//# sourceMappingURL=teachers.route.js.map