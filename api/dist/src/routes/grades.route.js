"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const role_1 = require("../middleware/role");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
// ──────────────────────────────────────────────
// Validation Schemas
// ──────────────────────────────────────────────
const gradeSchema = zod_1.z.object({
    type: zod_1.z.enum(["Tugas", "PSTS", "PSAS", "Kuis"]),
    score: zod_1.z.number().min(0, "Nilai tidak boleh negatif"),
    maxScore: zod_1.z.number().min(0, "Nilai maksimal tidak boleh negatif"),
    date: zod_1.z.string().min(1, "Tanggal wajib diisi"),
    studentId: zod_1.z.number().int().positive("ID siswa tidak valid"),
    subjectId: zod_1.z.number().int().positive("ID mata pelajaran tidak valid"),
});
// ──────────────────────────────────────────────
// GET /api/grades
// Akses: Semua role yang terautentikasi
// Siswa hanya melihat nilainya sendiri, Guru melihat semua, Orang Tua melihat nilai anaknya
// ──────────────────────────────────────────────
router.get("/", auth_1.verifyJWT, async (req, res) => {
    try {
        const { className, subject, type, search } = req.query;
        const where = {};
        if (className)
            where.student = { class: { name: String(className) } };
        if (subject)
            where.subject = { name: String(subject) };
        if (type)
            where.type = String(type);
        if (search) {
            where.student = {
                ...where.student,
                name: { contains: String(search), mode: "insensitive" },
            };
        }
        const grades = await prisma_1.prisma.grade.findMany({
            where,
            include: {
                student: { select: { name: true, class: { select: { name: true } } } },
                subject: { select: { name: true } },
            },
            orderBy: { date: "desc" },
        });
        const result = grades.map((g) => ({
            id: g.id,
            studentId: g.studentId,
            studentName: g.student.name,
            className: g.student.class.name,
            subjectId: g.subjectId,
            subjectName: g.subject.name,
            type: g.type,
            score: g.score,
            maxScore: g.maxScore,
            date: g.date.toISOString().split("T")[0],
            isLocked: g.isLocked,
            lockedAt: g.lockedAt,
        }));
        res.json({ success: true, data: result, total: result.length });
    }
    catch (error) {
        console.error("[Grades] GET error:", error);
        res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
    }
});
// ──────────────────────────────────────────────
// POST /api/grades
// Akses: Hanya Guru (teacher) yang boleh menambahkan nilai
// ──────────────────────────────────────────────
router.post("/", auth_1.verifyJWT, (0, role_1.checkRole)("admin", "teacher"), (0, validate_1.validate)(gradeSchema), async (req, res) => {
    try {
        const data = req.body;
        // Validasi: pastikan siswa dan mata pelajaran ada
        const [student, subject] = await Promise.all([
            prisma_1.prisma.student.findUnique({ where: { id: data.studentId } }),
            prisma_1.prisma.subject.findUnique({ where: { id: data.subjectId } }),
        ]);
        if (!student) {
            res.status(404).json({ success: false, message: "Siswa tidak ditemukan" });
            return;
        }
        if (!subject) {
            res.status(404).json({ success: false, message: "Mata pelajaran tidak ditemukan" });
            return;
        }
        // Validasi: score tidak boleh lebih besar dari maxScore
        if (data.score > data.maxScore) {
            res.status(400).json({
                success: false,
                message: "Nilai tidak boleh melebihi nilai maksimal",
            });
            return;
        }
        const grade = await prisma_1.prisma.grade.create({
            data: { ...data, date: new Date(data.date) },
        });
        res.status(201).json({
            success: true,
            message: "Nilai berhasil ditambahkan",
            data: grade,
        });
    }
    catch (error) {
        console.error("[Grades] POST error:", error);
        res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
    }
});
// ──────────────────────────────────────────────
// PUT /api/grades/:id
// Akses: Guru (teacher) — update nilai yang sudah ada
// ──────────────────────────────────────────────
router.put("/:id", auth_1.verifyJWT, (0, role_1.checkRole)("admin", "teacher"), (0, validate_1.validate)(gradeSchema.partial()), async (req, res) => {
    try {
        const data = req.body;
        if (data.date)
            data.date = new Date(data.date);
        const grade = await prisma_1.prisma.grade.update({
            where: { id: Number(req.params.id) },
            data,
        });
        res.json({
            success: true,
            message: "Nilai berhasil diperbarui",
            data: grade,
        });
    }
    catch (error) {
        if (error.code === "P2025") {
            res.status(404).json({ success: false, message: "Data nilai tidak ditemukan" });
            return;
        }
        console.error("[Grades] PUT error:", error);
        res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
    }
});
// ──────────────────────────────────────────────
// DELETE /api/grades/:id
// Akses: Admin dan Super Admin
// ──────────────────────────────────────────────
router.delete("/:id", auth_1.verifyJWT, (0, role_1.checkRole)("admin"), async (req, res) => {
    try {
        await prisma_1.prisma.grade.delete({ where: { id: Number(req.params.id) } });
        res.json({ success: true, message: "Nilai berhasil dihapus" });
    }
    catch (error) {
        if (error.code === "P2025") {
            res.status(404).json({ success: false, message: "Data nilai tidak ditemukan" });
            return;
        }
        console.error("[Grades] DELETE error:", error);
        res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
    }
});
// ──────────────────────────────────────────────
// POST /api/grades/:id/lock
// Akses: Guru (teacher) atau admin
// ──────────────────────────────────────────────
router.post("/:id/lock", auth_1.verifyJWT, (0, role_1.checkRole)("admin", "teacher"), async (req, res) => {
    try {
        const grade = await prisma_1.prisma.grade.findUnique({
            where: { id: Number(req.params.id) }
        });
        if (!grade) {
            res.status(404).json({
                success: false,
                message: "Data nilai tidak ditemukan"
            });
            return;
        }
        if (grade.isLocked) {
            res.status(400).json({
                success: false,
                message: "Nilai sudah terkunci"
            });
            return;
        }
        const updated = await prisma_1.prisma.grade.update({
            where: { id: Number(req.params.id) },
            data: {
                isLocked: true,
                lockedAt: new Date(),
                lockedBy: req.user?.id,
            }
        });
        res.json({
            success: true,
            message: "Nilai berhasil dikunci",
            data: updated
        });
    }
    catch (error) {
        console.error("[Grades] LOCK error:", error);
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server"
        });
    }
});
// ──────────────────────────────────────────────
// POST /api/grades/:id/unlock
// Akses: Hanya Admin
// ──────────────────────────────────────────────
router.post("/:id/unlock", auth_1.verifyJWT, (0, role_1.checkRole)("admin"), async (req, res) => {
    try {
        const grade = await prisma_1.prisma.grade.findUnique({
            where: { id: Number(req.params.id) }
        });
        if (!grade) {
            res.status(404).json({
                success: false,
                message: "Data nilai tidak ditemukan"
            });
            return;
        }
        if (!grade.isLocked) {
            res.status(400).json({
                success: false,
                message: "Nilai tidak dalam kondisi terkunci"
            });
            return;
        }
        const updated = await prisma_1.prisma.grade.update({
            where: { id: Number(req.params.id) },
            data: {
                isLocked: false,
                unlockedAt: new Date(),
                unlockedBy: req.user?.id,
            }
        });
        res.json({
            success: true,
            message: "Nilai berhasil di-unlock",
            data: updated
        });
    }
    catch (error) {
        console.error("[Grades] UNLOCK error:", error);
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server"
        });
    }
});
exports.default = router;
//# sourceMappingURL=grades.route.js.map