import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { verifyJWT } from "../middleware/auth";
import { checkRole } from "../middleware/role";
import { validate } from "../middleware/validate";

const router = Router();

const subjectSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  gradeLevel: z.number().int(),
  hoursPerWeek: z.number().int(),
  teacherId: z.number().int().positive(),
});

router.get("/", verifyJWT, async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: "insensitive" } },
        { code: { contains: String(search), mode: "insensitive" } },
      ];
    }
    const subjects = await prisma.subject.findMany({
      where,
      include: { teacher: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
    });
    const result = subjects.map((s) => ({
      id: s.id, code: s.code, name: s.name, gradeLevel: s.gradeLevel,
      hoursPerWeek: s.hoursPerWeek, teacherId: s.teacherId, teacherName: s.teacher.name,
    }));
    res.json({ data: result, total: result.length });
  } catch (error) { res.status(500).json({ message: "Terjadi kesalahan server" }); }
});

router.post("/", verifyJWT, checkRole("super_admin", "admin"), validate(subjectSchema), async (req: Request, res: Response) => {
  try {
    const subject = await prisma.subject.create({ data: req.body });
    res.status(201).json({ message: "Mapel berhasil ditambahkan", data: subject });
  } catch (error: any) {
    if (error.code === "P2002") { res.status(400).json({ message: "Kode mapel sudah digunakan" }); return; }
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

router.put("/:id", verifyJWT, checkRole("super_admin", "admin"), validate(subjectSchema.partial()), async (req: Request, res: Response) => {
  try {
    const subject = await prisma.subject.update({ where: { id: Number(req.params.id) }, data: req.body });
    res.json({ message: "Mapel berhasil diperbarui", data: subject });
  } catch (error: any) {
    if (error.code === "P2025") { res.status(404).json({ message: "Mapel tidak ditemukan" }); return; }
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

router.delete("/:id", verifyJWT, checkRole("super_admin", "admin"), async (req: Request, res: Response) => {
  try {
    await prisma.subject.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Mapel berhasil dihapus" });
  } catch (error: any) {
    if (error.code === "P2025") { res.status(404).json({ message: "Mapel tidak ditemukan" }); return; }
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

export default router;
