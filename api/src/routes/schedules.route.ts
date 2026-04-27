import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { verifyJWT } from "../middleware/auth";
import { checkRole } from "../middleware/role";
import { validate } from "../middleware/validate";

const router = Router();

const scheduleSchema = z.object({
  day: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  room: z.string().min(1),
  subjectId: z.number().int().positive(),
  teacherId: z.number().int().positive(),
  gradeId: z.number().int().positive(),
});

router.get("/", verifyJWT, async (req: Request, res: Response) => {
  try {
    const { grade } = req.query;
    const where: any = {};
    if (grade) where.grade = { name: String(grade) };

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        subject: { select: { name: true } },
        teacher: { select: { name: true } },
        grade: { select: { name: true } },
      },
      orderBy: [{ day: "asc" }, { startTime: "asc" }],
    });
    const result = schedules.map((s) => ({
      id: s.id, day: s.day, startTime: s.startTime, endTime: s.endTime,
      room: s.room, subjectName: s.subject.name, teacherName: s.teacher.name, gradeName: s.grade.name,
    }));
    res.json({ data: result, total: result.length });
  } catch (error) { res.status(500).json({ message: "Terjadi kesalahan server" }); }
});

router.post("/", verifyJWT, checkRole("super_admin", "admin"), validate(scheduleSchema), async (req: Request, res: Response) => {
  try {
    const schedule = await prisma.schedule.create({ data: req.body });
    res.status(201).json({ message: "Jadwal berhasil ditambahkan", data: schedule });
  } catch (error) { res.status(500).json({ message: "Terjadi kesalahan server" }); }
});

router.put("/:id", verifyJWT, checkRole("super_admin", "admin"), validate(scheduleSchema.partial()), async (req: Request, res: Response) => {
  try {
    const schedule = await prisma.schedule.update({ where: { id: Number(req.params.id) }, data: req.body });
    res.json({ message: "Jadwal berhasil diperbarui", data: schedule });
  } catch (error: any) {
    if (error.code === "P2025") { res.status(404).json({ message: "Jadwal tidak ditemukan" }); return; }
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

router.delete("/:id", verifyJWT, checkRole("super_admin", "admin"), async (req: Request, res: Response) => {
  try {
    await prisma.schedule.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Jadwal berhasil dihapus" });
  } catch (error: any) {
    if (error.code === "P2025") { res.status(404).json({ message: "Jadwal tidak ditemukan" }); return; }
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

export default router;
