import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { verifyJWT } from "../middleware/auth";
import { checkRole } from "../middleware/role";
import { readOnlyKepalaSekolah } from "../middleware/principal-guard";
import { validate } from "../middleware/validate";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

const router = Router();

// Apply read-only guard for kepala_sekolah to all routes in this file
router.use(readOnlyKepalaSekolah);

const teacherAttendanceSchema = z.object({
  date: z.string().min(1),
  status: z.enum(["hadir", "izin", "sakit", "alpa"]),
  note: z.string().optional().nullable(),
  teacherId: z.number().int().positive(),
});

// GET /api/teacher-attendances
router.get("/", verifyJWT, async (req: Request, res: Response) => {
  try {
    const { status, date, search } = req.query;
    const where: any = {};
    
    if (status) where.status = String(status);
    if (date) where.date = new Date(String(date));
    if (search) {
      where.teacher = {
        name: { contains: String(search), mode: "insensitive" },
      };
    }

    const attendances = await prisma.teacherAttendance.findMany({
      where,
      include: {
        teacher: { select: { name: true, nip: true } },
      },
      orderBy: { date: "desc" },
    });
    
    const result = attendances.map((a) => ({
      id: a.id,
      teacherId: a.teacherId,
      teacherName: a.teacher.name,
      nip: a.teacher.nip,
      date: a.date.toISOString().split("T")[0],
      status: a.status,
      note: a.note,
    }));
    
    res.json({ success: true, data: result, total: result.length });
  } catch (error) {
    console.error("[TeacherAttendances] GET error:", error);
    res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
});

// POST (Only admin/teacher/principal-readonly)
router.post(
  "/",
  verifyJWT,
  checkRole("super_admin", "admin", "teacher", "kepala_sekolah"),
  validate(teacherAttendanceSchema),
  async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const att = await prisma.teacherAttendance.create({
        data: { ...data, date: new Date(data.date) },
      });
      res.status(201).json({ success: true, message: "Kehadiran guru berhasil dicatat", data: att });
    } catch (error) {
      console.error("[TeacherAttendances] POST error:", error);
      res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
    }
  }
);

// EXPORT EXCEL
router.get("/export/excel", verifyJWT, checkRole("super_admin", "admin", "kepala_sekolah"), async (req: Request, res: Response) => {
  try {
    const attendances = await prisma.teacherAttendance.findMany({
      include: { teacher: { select: { name: true, nip: true } } },
      orderBy: { date: "desc" },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Kehadiran Guru");

    worksheet.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "NIP", key: "nip", width: 20 },
      { header: "Nama Guru", key: "name", width: 30 },
      { header: "Tanggal", key: "date", width: 15 },
      { header: "Status", key: "status", width: 15 },
      { header: "Keterangan", key: "note", width: 25 },
    ];

    worksheet.getRow(1).font = { bold: true };

    attendances.forEach((att, index) => {
      worksheet.addRow({
        no: index + 1,
        nip: att.teacher.nip,
        name: att.teacher.name,
        date: att.date.toISOString().split("T")[0],
        status: att.status.toUpperCase(),
        note: att.note || "-",
      });
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=Kehadiran_Guru.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal export Excel" });
  }
});

// EXPORT PDF
router.get("/export/pdf", verifyJWT, checkRole("super_admin", "admin", "kepala_sekolah"), async (req: Request, res: Response) => {
  try {
    const attendances = await prisma.teacherAttendance.findMany({
      include: { teacher: { select: { name: true, nip: true } } },
      orderBy: { date: "desc" },
    });

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=Kehadiran_Guru.pdf");
    doc.pipe(res);

    doc.fontSize(18).text("Laporan Kehadiran Guru", { align: "center" });
    doc.moveDown();

    attendances.forEach((att, index) => {
      doc.fontSize(10).text(`${index + 1}. ${att.teacher.name} (${att.teacher.nip}) - ${att.date.toISOString().split("T")[0]} - ${att.status.toUpperCase()}`);
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal export PDF" });
  }
});

// EXPORT CSV
router.get("/export/csv", verifyJWT, checkRole("super_admin", "admin", "kepala_sekolah"), async (req: Request, res: Response) => {
  try {
    const attendances = await prisma.teacherAttendance.findMany({
      include: { teacher: { select: { name: true, nip: true } } },
      orderBy: { date: "desc" },
    });

    let csv = "No,NIP,Nama Guru,Tanggal,Status,Keterangan\n";
    attendances.forEach((att, index) => {
      csv += `${index + 1},${att.teacher.nip},${att.teacher.name},${att.date.toISOString().split("T")[0]},${att.status},${att.note || "-"}\n`;
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=Kehadiran_Guru.csv");
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal export CSV" });
  }
});

export default router;
