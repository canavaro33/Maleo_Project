import express, { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyJWT } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

router.get("/today", verifyJWT, async (req: any, res: Response) => {
  try {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const hour = now.getHours();

    // Ambil teacherId
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { nipNis: true }
    });
    const teacher = await prisma.teacher.findUnique({
      where: { nip: user!.nipNis! }
    });

    if (!teacher) {
      return res.status(404).json({ success: false, message: "Data guru tidak ditemukan." });
    }

    const existing = await prisma.teacherAttendance.findUnique({
      where: { teacherId_date: { teacherId: teacher.id, date: today } }
    });

    const isWindowOpen = hour >= 6 && hour < 10;

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
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Terjadi kesalahan server." });
  }
});

router.post("/checkin", verifyJWT, async (req: any, res: Response) => {
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

    // Ambil teacherId dari user
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { nipNis: true }
    });
    const teacher = await prisma.teacher.findUnique({
      where: { nip: user!.nipNis! }
    });

    if (!teacher) {
      return res.status(404).json({ success: false, message: "Data guru tidak ditemukan." });
    }

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

    // Layer 1: Hitung keterlambatan
    // Jam masuk seharusnya 07:00 (bisa dikonfigurasi)
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
        status: finalStatus as any,
        checkinAt: now,         // Layer 1: timestamp tidak bisa dimanipulasi
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
  } catch (error) {
    res.status(500).json({ success: false, message: "Terjadi kesalahan server." });
  }
});

router.get("/", verifyJWT, async (req: any, res: Response) => {
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
  } catch (error) {
    res.status(500).json({ success: false, message: "Terjadi kesalahan server." });
  }
});

router.put("/:id/override", verifyJWT, async (req: any, res: Response) => {
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
        overriddenBy: req.user.id,   // Layer 4: catat siapa yang ubah
        overriddenAt: new Date(),     // Layer 4: catat kapan diubah
        overrideReason,               // Layer 4: catat alasan
      }
    });

    res.json({
      success: true,
      message: "Status kehadiran berhasil diperbarui.",
      data: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Terjadi kesalahan server." });
  }
});

router.get("/export", async (req: any, res: Response) => {
  try {
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
        date: `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`,
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
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal export Excel." });
  }
});

export default router;
