"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// ──────────────────────────────────────────────
// GET /today — Status check-in hari ini (guru)
// ──────────────────────────────────────────────
router.get("/today", auth_1.verifyJWT, async (req, res) => {
    try {
        const now = new Date();
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        const hour = now.getHours();
        // Fix Bug 4: 1 query saja via relasi langsung User → Teacher
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { teacher: true }
        });
        if (!user?.teacher) {
            return res.status(404).json({
                success: false,
                message: "Data guru tidak ditemukan. Pastikan akun Anda terhubung ke profil guru."
            });
        }
        const teacher = user.teacher;
        const existing = await prisma.teacherAttendance.findUnique({
            where: { teacherId_date: { teacherId: teacher.id, date: today } }
        });
        const isWindowOpen = hour >= 6 && hour < 10;
        // Fix Bug 8: Cek apakah guru punya jadwal hari ini
        const dayName = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][now.getDay()];
        const hasScheduleToday = await prisma.schedule.count({
            where: { teacherId: teacher.id, day: dayName }
        });
        res.json({
            success: true,
            data: {
                hasCheckedIn: !!existing,
                attendance: existing || null,
                isWindowOpen,
                windowMessage: hour < 6
                    ? "Check-in dibuka pukul 06:00"
                    : hour >= 10
                        ? "Waktu check-in sudah ditutup (10:00)"
                        : `Check-in ditutup pukul 10:00 (${10 - hour} jam lagi)`,
                currentTime: now.toISOString(),
                hasScheduleToday: hasScheduleToday > 0,
                warningMessage: hasScheduleToday === 0
                    ? "Anda tidak memiliki jadwal mengajar hari ini."
                    : null,
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Terjadi kesalahan server." });
    }
});
// ──────────────────────────────────────────────
// POST /checkin — Check-in mandiri guru
// ──────────────────────────────────────────────
router.post("/checkin", auth_1.verifyJWT, async (req, res) => {
    try {
        if (req.user.role !== "teacher") {
            return res.status(403).json({ success: false, message: "Hanya guru yang bisa check-in." });
        }
        const now = new Date();
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        // Layer 2: Window waktu check-in 06:00 - 10:00
        const hour = now.getHours();
        const isAfterWindow = hour >= 10;
        const isBeforeWindow = hour < 6;
        // Fix Bug 4: 1 query saja via relasi langsung User → Teacher
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { teacher: true }
        });
        if (!user?.teacher) {
            return res.status(404).json({
                success: false,
                message: "Data guru tidak ditemukan. Pastikan akun Anda terhubung ke profil guru."
            });
        }
        const teacher = user.teacher;
        // Cek apakah sudah check-in hari ini
        const existing = await prisma.teacherAttendance.findUnique({
            where: { teacherId_date: { teacherId: teacher.id, date: today } }
        });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: "Anda sudah melakukan check-in hari ini.",
                data: existing
            });
        }
        const { status, note } = req.body;
        // Kalau di luar window dan mau check-in hadir → tolak
        if ((isBeforeWindow || isAfterWindow) && status === 'hadir') {
            return res.status(400).json({
                success: false,
                message: isBeforeWindow
                    ? "Check-in belum dibuka. Buka mulai jam 06:00."
                    : "Waktu check-in sudah ditutup (10:00). Silakan ajukan Izin atau Sakit."
            });
        }
        // Layer 1: Hitung keterlambatan (jam masuk seharusnya 07:00)
        const SCHOOL_START_HOUR = 7;
        const SCHOOL_START_MINUTE = 0;
        const isLate = hour > SCHOOL_START_HOUR ||
            (hour === SCHOOL_START_HOUR && now.getMinutes() > SCHOOL_START_MINUTE);
        const lateMinutes = isLate
            ? (hour - SCHOOL_START_HOUR) * 60 + now.getMinutes() - SCHOOL_START_MINUTE
            : 0;
        const finalStatus = status === 'hadir' && isLate ? 'terlambat' : status;
        const attendance = await prisma.teacherAttendance.create({
            data: {
                teacherId: teacher.id,
                date: today,
                status: finalStatus,
                checkinAt: now, // Layer 1: timestamp tidak bisa dimanipulasi
                checkinType: 'self',
                note: note || null,
                isLate,
                lateMinutes: lateMinutes > 0 ? lateMinutes : null,
            }
        });
        res.status(201).json({
            success: true,
            message: isLate
                ? `Check-in berhasil. Terlambat ${lateMinutes} menit.`
                : "Check-in berhasil. Selamat bekerja!",
            data: attendance
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Terjadi kesalahan server." });
    }
});
// ──────────────────────────────────────────────
// Fix Bug 6: /export HARUS sebelum /:id
// Fix Bug 5: tambah verifyJWT + role check
// ──────────────────────────────────────────────
router.get("/export", auth_1.verifyJWT, async (req, res) => {
    try {
        // Fix Bug 5: hanya admin dan kepala sekolah yang bisa export
        if (req.user.role !== "admin" && req.user.role !== "kepala_sekolah") {
            return res.status(403).json({ success: false, message: "Akses ditolak." });
        }
        const { month, year } = req.query;
        const targetMonth = month ? Number(month) - 1 : new Date().getMonth();
        const targetYear = year ? Number(year) : new Date().getFullYear();
        const startDate = new Date(targetYear, targetMonth, 1);
        const endDate = new Date(targetYear, targetMonth + 1, 0);
        const attendances = await prisma.teacherAttendance.findMany({
            where: {
                date: { gte: startDate, lte: endDate }
            },
            include: {
                teacher: { select: { name: true, nip: true } }
            },
            orderBy: [{ date: 'asc' }, { teacher: { name: 'asc' } }]
        });
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Rekap Kehadiran Guru');
        worksheet.columns = [
            { header: 'No', key: 'no', width: 5 },
            { header: 'Nama Guru', key: 'name', width: 30 },
            { header: 'NIP', key: 'nip', width: 20 },
            { header: 'Tanggal', key: 'date', width: 15 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Jam Check-in', key: 'checkinAt', width: 15 },
            { header: 'Terlambat (menit)', key: 'lateMinutes', width: 18 },
            { header: 'Keterangan', key: 'note', width: 25 },
            { header: 'Tipe Input', key: 'checkinType', width: 15 },
            { header: 'Dioverride Oleh', key: 'overriddenBy', width: 20 },
            { header: 'Alasan Override', key: 'overrideReason', width: 30 },
        ];
        // Styling header
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern', pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' }
        };
        attendances.forEach((a, i) => {
            const d = new Date(a.date);
            worksheet.addRow({
                no: i + 1,
                name: a.teacher.name,
                nip: a.teacher.nip,
                date: `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`,
                status: a.status.toUpperCase(),
                checkinAt: a.checkinAt
                    ? new Date(a.checkinAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                    : '-',
                lateMinutes: a.lateMinutes || 0,
                note: a.note || '-',
                checkinType: a.checkinType === 'self' ? 'Mandiri' : 'Admin Override',
                overriddenBy: a.overriddenBy ? `User ID: ${a.overriddenBy}` : '-',
                overrideReason: a.overrideReason || '-',
            });
        });
        const monthName = new Date(targetYear, targetMonth).toLocaleString('id-ID', { month: 'long' });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Rekap_Kehadiran_Guru_${monthName}_${targetYear}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Gagal export Excel." });
    }
});
// ──────────────────────────────────────────────
// GET / — List semua kehadiran (admin/kepala)
// ──────────────────────────────────────────────
router.get("/", auth_1.verifyJWT, async (req, res) => {
    try {
        if (req.user.role !== "admin" && req.user.role !== "kepala_sekolah") {
            return res.status(403).json({ success: false, message: "Akses ditolak." });
        }
        const { month, year } = req.query;
        const targetMonth = month ? Number(month) - 1 : new Date().getMonth();
        const targetYear = year ? Number(year) : new Date().getFullYear();
        const startDate = new Date(targetYear, targetMonth, 1);
        const endDate = new Date(targetYear, targetMonth + 1, 0);
        const attendances = await prisma.teacherAttendance.findMany({
            where: {
                date: { gte: startDate, lte: endDate }
            },
            include: {
                teacher: { select: { name: true, nip: true } }
            },
            orderBy: [{ date: 'desc' }, { teacher: { name: 'asc' } }]
        });
        res.json({ success: true, data: attendances });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Terjadi kesalahan server." });
    }
});
// ──────────────────────────────────────────────
// PUT /:id/override — Override kehadiran (admin)
// Tetap setelah /export dan / agar tidak conflict
// ──────────────────────────────────────────────
router.put("/:id/override", auth_1.verifyJWT, async (req, res) => {
    try {
        // Hanya admin yang boleh override
        if (req.user.role !== "admin") {
            return res.status(403).json({ success: false, message: "Hanya admin yang bisa override." });
        }
        const { status, note, overrideReason } = req.body;
        if (!overrideReason) {
            return res.status(400).json({
                success: false,
                message: "Alasan override wajib diisi untuk audit trail."
            });
        }
        const updated = await prisma.teacherAttendance.update({
            where: { id: Number(req.params.id) },
            data: {
                status,
                note,
                checkinType: 'admin_override',
                overriddenBy: req.user.id, // Layer 4: catat siapa yang ubah
                overriddenAt: new Date(), // Layer 4: catat kapan diubah
                overrideReason, // Layer 4: catat alasan
            }
        });
        res.json({
            success: true,
            message: "Status kehadiran berhasil diperbarui.",
            data: updated
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Terjadi kesalahan server." });
    }
});
// ──────────────────────────────────────────────
// POST /manual-input — Input manual oleh admin
// Untuk guru yang lupa check-in sendiri
// ──────────────────────────────────────────────
router.post("/manual-input", auth_1.verifyJWT, async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ success: false, message: "Akses ditolak." });
        }
        const { teacherId, date, status, note, overrideReason } = req.body;
        if (!teacherId || !date || !status || !overrideReason) {
            return res.status(400).json({
                success: false,
                message: "teacherId, date, status, dan overrideReason wajib diisi."
            });
        }
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);
        // Cek apakah sudah ada record di tanggal itu
        const existing = await prisma.teacherAttendance.findUnique({
            where: { teacherId_date: { teacherId: Number(teacherId), date: targetDate } }
        });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: "Sudah ada record kehadiran untuk guru ini di tanggal tersebut. Gunakan fitur override."
            });
        }
        const attendance = await prisma.teacherAttendance.create({
            data: {
                teacherId: Number(teacherId),
                date: targetDate,
                status: status,
                checkinAt: null, // tidak ada timestamp karena input manual
                checkinType: 'admin_override',
                note: note || null,
                isLate: false,
                overriddenBy: req.user.id,
                overriddenAt: new Date(),
                overrideReason,
            }
        });
        res.status(201).json({
            success: true,
            message: "Kehadiran guru berhasil diinput secara manual.",
            data: attendance
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Terjadi kesalahan server." });
    }
});
exports.default = router;
//# sourceMappingURL=teacher-attendances.route.js.map