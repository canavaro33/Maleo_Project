import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { verifyJWT } from "../middleware/auth";
import { checkRole } from "../middleware/role";
import { validate } from "../middleware/validate";
import ExcelJS from "exceljs";

const router = Router();

const attendanceSchema = z.object({
  date: z.string().min(1),
  status: z.enum(["hadir", "izin", "sakit", "alpa"]),
  note: z.string().optional().nullable(),
  studentId: z.number().int().positive(),
});

const bulkSchema = z.object({
  classId: z.number().int().positive(),
  date: z.string().min(1),
  records: z.array(
    z.object({
      studentId: z.number().int().positive(),
      status: z.enum(["hadir", "izin", "sakit", "alpa"]),
      note: z.string().optional().nullable(),
    })
  ),
});

// GET /api/attendances/by-class
router.get("/by-class", verifyJWT, async (req: Request, res: Response) => {
  try {
    const { classId, date } = req.query;
    if (!classId || !date) {
      res.status(400).json({ success: false, message: "classId dan date diperlukan" });
      return;
    }

    const cId = Number(classId);
    const targetDate = new Date(String(date));
    targetDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(targetDate);
    nextDay.setDate(targetDate.getDate() + 1);

    const students = await prisma.student.findMany({
      where: { classId: cId },
      include: {
        attendances: {
          where: {
            date: {
              gte: targetDate,
              lt: nextDay,
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const results = students.map((s) => {
      const attendance = s.attendances[0]; // will be undefined if no record exists
      return {
        studentId: s.id,
        nis: s.nis,
        name: s.name,
        status: attendance ? attendance.status : "hadir", // Default to 'hadir'
        note: attendance ? attendance.note : "",
      };
    });

    res.json({ success: true, data: results });
  } catch (error) {
    console.error("[Attendances by-class] GET error:", error);
    res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
});

// POST /api/attendances/bulk
router.post(
  "/bulk",
  verifyJWT,
  checkRole("super_admin", "admin", "teacher"),
  validate(bulkSchema),
  async (req: Request, res: Response) => {
    try {
      const { classId, date, records } = req.body as z.infer<typeof bulkSchema>;
      
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(targetDate.getDate() + 1);

      // Cek apakah data kehadiran sudah pernah diinput untuk tanggal dan kelas ini
      const existingRecord = await prisma.attendance.findFirst({
        where: {
          date: { gte: targetDate, lt: nextDay },
          student: { classId: classId },
        },
      });

      if (existingRecord) {
        res.status(400).json({
          success: false,
          message: "Data absensi untuk kelas dan tanggal ini sudah ada. Silakan gunakan fitur edit jika ingin mengubah.",
        });
        return;
      }

      const createData = records.map((record) => ({
        studentId: record.studentId,
        date: targetDate,
        status: record.status,
        note: record.note,
      }));

      await prisma.attendance.createMany({
        data: createData,
      });

      res.status(201).json({
        success: true,
        message: "Data absensi batch berhasil disimpan",
      });
    } catch (error) {
      console.error("[Attendances bulk] POST error:", error);
      res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
    }
  }
);

router.get("/", verifyJWT, async (req: Request, res: Response) => {
  try {
    const { className, status, date, search } = req.query;
    const where: any = {};
    if (className) where.student = { class: { name: String(className) } };
    if (status) where.status = String(status);
    if (date) where.date = new Date(String(date));
    if (search) {
      where.student = {
        ...where.student,
        name: { contains: String(search), mode: "insensitive" },
      };
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        student: { select: { name: true, class: { select: { name: true } } } },
      },
      orderBy: { date: "desc" },
    });
    const result = attendances.map((a) => ({
      id: a.id,
      studentId: a.studentId,
      studentName: a.student.name,
      className: a.student.class.name,
      date: a.date.toISOString().split("T")[0],
      status: a.status,
      note: a.note,
    }));
    res.json({ success: true, data: result, total: result.length });
  } catch (error) {
    console.error("[Attendances] GET error:", error);
    res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
});

router.post(
  "/",
  verifyJWT,
  checkRole("super_admin", "admin", "teacher"),
  validate(attendanceSchema),
  async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const att = await prisma.attendance.create({
        data: { ...data, date: new Date(data.date) },
      });
      res.status(201).json({ success: true, message: "Kehadiran berhasil dicatat", data: att });
    } catch (error) {
      console.error("[Attendances] POST error:", error);
      res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
    }
  }
);

router.put(
  "/:id",
  verifyJWT,
  checkRole("super_admin", "admin", "teacher"),
  validate(attendanceSchema.partial()),
  async (req: Request, res: Response) => {
    try {
      const data = req.body;
      if (data.date) data.date = new Date(data.date);
      const att = await prisma.attendance.update({
        where: { id: Number(req.params.id) },
        data,
      });
      res.json({ success: true, message: "Kehadiran berhasil diperbarui", data: att });
    } catch (error: any) {
      if (error.code === "P2025") {
        res.status(404).json({ success: false, message: "Data tidak ditemukan" });
        return;
      }
      res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
    }
  }
);

router.delete(
  "/:id",
  verifyJWT,
  checkRole("super_admin", "admin"),
  async (req: Request, res: Response) => {
    try {
      await prisma.attendance.delete({ where: { id: Number(req.params.id) } });
      res.json({ success: true, message: "Kehadiran berhasil dihapus" });
    } catch (error: any) {
      if (error.code === "P2025") {
        res.status(404).json({ success: false, message: "Data tidak ditemukan" });
        return;
      }
      res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
    }
  }
);

router.get("/export/excel", verifyJWT, async (req: Request, res: Response) => {
  try {
    const attendances = await prisma.attendance.findMany({
      include: {
        student: { select: { name: true } },
      },
      orderBy: { date: "desc" },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Rekap Kehadiran");

    worksheet.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "Nama Siswa", key: "studentName", width: 30 },
      { header: "Tanggal", key: "date", width: 15 },
      { header: "Status", key: "status", width: 15 },
      { header: "Keterangan", key: "note", width: 25 },
    ];

    // Styling Header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD3D3D3" },
    };

    attendances.forEach((att, index) => {
      const d = att.date;
      const formattedDate = `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;

      worksheet.addRow({
        no: index + 1,
        studentName: att.student.name,
        date: formattedDate,
        status: att.status.toUpperCase(),
        note: att.note || "-",
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Rekap_Kehadiran_Maleo.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("[Attendances] Export error:", error);
    res.status(500).json({ success: false, message: "Terjadi kesalahan server saat export" });
  }
});

export default router;
