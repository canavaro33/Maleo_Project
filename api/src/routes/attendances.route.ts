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
