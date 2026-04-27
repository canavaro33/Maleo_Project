import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { verifyJWT } from "../middleware/auth";
import { checkRole } from "../middleware/role";
import { validate } from "../middleware/validate";

const router = Router();

const scoreSchema = z.object({
  type: z.enum(["Tugas", "UTS", "UAS", "Kuis"]),
  score: z.number().min(0),
  maxScore: z.number().min(0),
  date: z.string().min(1),
  studentId: z.number().int().positive(),
  subjectId: z.number().int().positive(),
});

router.get("/", verifyJWT, async (req: Request, res: Response) => {
  try {
    const { grade, subject, type, search } = req.query;
    const where: any = {};
    if (grade) where.student = { grade: { name: String(grade) } };
    if (subject) where.subject = { name: String(subject) };
    if (type) where.type = String(type);
    if (search) {
      where.student = { ...where.student, name: { contains: String(search), mode: "insensitive" } };
    }

    const scores = await prisma.score.findMany({
      where,
      include: {
        student: { select: { name: true, grade: { select: { name: true } } } },
        subject: { select: { name: true } },
      },
      orderBy: { date: "desc" },
    });
    const result = scores.map((s) => ({
      id: s.id, studentId: s.studentId, studentName: s.student.name,
      gradeName: s.student.grade.name, subjectName: s.subject.name,
      type: s.type, score: s.score, maxScore: s.maxScore, date: s.date.toISOString().split("T")[0],
    }));
    res.json({ data: result, total: result.length });
  } catch (error) { res.status(500).json({ message: "Terjadi kesalahan server" }); }
});

router.post("/", verifyJWT, checkRole("super_admin", "admin", "teacher"), validate(scoreSchema), async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const score = await prisma.score.create({ data: { ...data, date: new Date(data.date) } });
    res.status(201).json({ message: "Nilai berhasil ditambahkan", data: score });
  } catch (error) { res.status(500).json({ message: "Terjadi kesalahan server" }); }
});

router.put("/:id", verifyJWT, checkRole("super_admin", "admin", "teacher"), validate(scoreSchema.partial()), async (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (data.date) data.date = new Date(data.date);
    const score = await prisma.score.update({ where: { id: Number(req.params.id) }, data });
    res.json({ message: "Nilai berhasil diperbarui", data: score });
  } catch (error: any) {
    if (error.code === "P2025") { res.status(404).json({ message: "Data tidak ditemukan" }); return; }
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

router.delete("/:id", verifyJWT, checkRole("super_admin", "admin"), async (req: Request, res: Response) => {
  try {
    await prisma.score.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Nilai berhasil dihapus" });
  } catch (error: any) {
    if (error.code === "P2025") { res.status(404).json({ message: "Data tidak ditemukan" }); return; }
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

export default router;
