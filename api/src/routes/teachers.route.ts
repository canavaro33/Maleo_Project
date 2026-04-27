import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { verifyJWT } from "../middleware/auth";
import { checkRole } from "../middleware/role";
import { validate } from "../middleware/validate";

const router = Router();

const teacherSchema = z.object({
  nip: z.string().min(1, "NIP wajib diisi"),
  name: z.string().min(1, "Nama wajib diisi"),
  gender: z.enum(["L", "P"]),
  email: z.string().email("Email tidak valid"),
  phone: z.string().min(1, "Telepon wajib diisi"),
  subject: z.string().min(1, "Mata pelajaran wajib diisi"),
  status: z.enum(["active", "inactive"]).optional(),
});

// GET /api/teachers
router.get("/", verifyJWT, async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: "insensitive" } },
        { nip: { contains: String(search) } },
        { subject: { contains: String(search), mode: "insensitive" } },
      ];
    }
    const teachers = await prisma.teacher.findMany({ where, orderBy: { name: "asc" } });
    res.json({ data: teachers, total: teachers.length });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

// GET /api/teachers/:id
router.get("/:id", verifyJWT, async (req: Request, res: Response) => {
  try {
    const teacher = await prisma.teacher.findUnique({ where: { id: Number(req.params.id) } });
    if (!teacher) { res.status(404).json({ message: "Guru tidak ditemukan" }); return; }
    res.json({ data: teacher });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

// POST /api/teachers
router.post("/", verifyJWT, checkRole("super_admin", "admin"), validate(teacherSchema), async (req: Request, res: Response) => {
  try {
    const teacher = await prisma.teacher.create({ data: req.body });
    res.status(201).json({ message: "Guru berhasil ditambahkan", data: teacher });
  } catch (error: any) {
    if (error.code === "P2002") { res.status(400).json({ message: "NIP atau email sudah digunakan" }); return; }
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

// PUT /api/teachers/:id
router.put("/:id", verifyJWT, checkRole("super_admin", "admin"), validate(teacherSchema.partial()), async (req: Request, res: Response) => {
  try {
    const teacher = await prisma.teacher.update({ where: { id: Number(req.params.id) }, data: req.body });
    res.json({ message: "Guru berhasil diperbarui", data: teacher });
  } catch (error: any) {
    if (error.code === "P2025") { res.status(404).json({ message: "Guru tidak ditemukan" }); return; }
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

// DELETE /api/teachers/:id
router.delete("/:id", verifyJWT, checkRole("super_admin", "admin"), async (req: Request, res: Response) => {
  try {
    await prisma.teacher.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Guru berhasil dihapus" });
  } catch (error: any) {
    if (error.code === "P2025") { res.status(404).json({ message: "Guru tidak ditemukan" }); return; }
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

export default router;
