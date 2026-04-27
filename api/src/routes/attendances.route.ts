import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { verifyJWT } from "../middleware/auth";
import { checkRole } from "../middleware/role";
import { validate } from "../middleware/validate";

const router = Router();

const attendanceSchema = z.object({
  date: z.string().min(1),
  status: z.enum(["hadir", "izin", "sakit", "alpa"]),
  note: z.string().optional().nullable(),
  studentId: z.number().int().positive(),
});

router.get("/", verifyJWT, async (req: Request, res: Response) => {
  try {
    const { grade, status, date, search } = req.query;
    const where: any = {};
    if (grade) where.student = { grade: { name: String(grade) } };
    if (status) where.status = String(status);
    if (date) where.date = new Date(String(date));
    if (search) {
      where.student = { ...where.student, name: { contains: String(search), mode: "insensitive" } };
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: { student: { select: { name: true, grade: { select: { name: true } } } } },
      orderBy: { date: "desc" },
    });
    const result = attendances.map((a) => ({
      id: a.id, studentId: a.studentId, studentName: a.student.name,
      gradeName: a.student.grade.name, date: a.date.toISOString().split("T")[0],
      status: a.status, note: a.note,
    }));
    res.json({ data: result, total: result.length });
  } catch (error) { res.status(500).json({ message: "Terjadi kesalahan server" }); }
});

router.post("/", verifyJWT, checkRole("super_admin", "admin", "teacher"), validate(attendanceSchema), async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const att = await prisma.attendance.create({ data: { ...data, date: new Date(data.date) } });
    res.status(201).json({ message: "Kehadiran berhasil dicatat", data: att });
  } catch (error) { res.status(500).json({ message: "Terjadi kesalahan server" }); }
});

router.put("/:id", verifyJWT, checkRole("super_admin", "admin", "teacher"), validate(attendanceSchema.partial()), async (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (data.date) data.date = new Date(data.date);
    const att = await prisma.attendance.update({ where: { id: Number(req.params.id) }, data });
    res.json({ message: "Kehadiran berhasil diperbarui", data: att });
  } catch (error: any) {
    if (error.code === "P2025") { res.status(404).json({ message: "Data tidak ditemukan" }); return; }
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

router.delete("/:id", verifyJWT, checkRole("super_admin", "admin"), async (req: Request, res: Response) => {
  try {
    await prisma.attendance.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Kehadiran berhasil dihapus" });
  } catch (error: any) {
    if (error.code === "P2025") { res.status(404).json({ message: "Data tidak ditemukan" }); return; }
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

export default router;
