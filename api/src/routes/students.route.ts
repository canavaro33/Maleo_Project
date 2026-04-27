import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { verifyJWT } from "../middleware/auth";
import { checkRole } from "../middleware/role";
import { validate } from "../middleware/validate";

const router = Router();

const studentSchema = z.object({
  nis: z.string().min(1, "NIS wajib diisi"),
  name: z.string().min(1, "Nama wajib diisi"),
  gender: z.enum(["L", "P"]),
  birthDate: z.string().min(1, "Tanggal lahir wajib diisi"),
  address: z.string().min(1, "Alamat wajib diisi"),
  phone: z.string().min(1, "Telepon wajib diisi"),
  gradeId: z.number().int().positive(),
  guardianId: z.number().int().positive().optional().nullable(),
  status: z.enum(["active", "inactive"]).optional(),
});

// GET /api/students
router.get("/", verifyJWT, async (req: Request, res: Response) => {
  try {
    const { search, grade } = req.query;
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: "insensitive" } },
        { nis: { contains: String(search) } },
      ];
    }
    if (grade) {
      where.grade = { name: String(grade) };
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        grade: { select: { id: true, name: true } },
        guardian: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    });

    const result = students.map((s) => ({
      id: s.id,
      nis: s.nis,
      name: s.name,
      gender: s.gender,
      birthDate: s.birthDate.toISOString().split("T")[0],
      address: s.address,
      phone: s.phone,
      gradeId: s.gradeId,
      gradeName: s.grade.name,
      status: s.status,
      guardianId: s.guardianId,
      guardianName: s.guardian?.name || null,
    }));

    res.json({ data: result, total: result.length });
  } catch (error) {
    console.error("Get students error:", error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

// GET /api/students/:id
router.get("/:id", verifyJWT, async (req: Request, res: Response) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        grade: { select: { id: true, name: true } },
        guardian: { select: { id: true, name: true } },
      },
    });
    if (!student) {
      res.status(404).json({ message: "Siswa tidak ditemukan" });
      return;
    }
    res.json({ data: student });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

// POST /api/students
router.post("/", verifyJWT, checkRole("super_admin", "admin"), validate(studentSchema), async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const student = await prisma.student.create({
      data: {
        ...data,
        birthDate: new Date(data.birthDate),
      },
    });
    res.status(201).json({ message: "Siswa berhasil ditambahkan", data: student });
  } catch (error: any) {
    if (error.code === "P2002") {
      res.status(400).json({ message: "NIS sudah digunakan" });
      return;
    }
    console.error("Create student error:", error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

// PUT /api/students/:id
router.put("/:id", verifyJWT, checkRole("super_admin", "admin"), validate(studentSchema.partial()), async (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (data.birthDate) data.birthDate = new Date(data.birthDate);

    const student = await prisma.student.update({
      where: { id: Number(req.params.id) },
      data,
    });
    res.json({ message: "Siswa berhasil diperbarui", data: student });
  } catch (error: any) {
    if (error.code === "P2025") {
      res.status(404).json({ message: "Siswa tidak ditemukan" });
      return;
    }
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

// DELETE /api/students/:id
router.delete("/:id", verifyJWT, checkRole("super_admin", "admin"), async (req: Request, res: Response) => {
  try {
    await prisma.student.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Siswa berhasil dihapus" });
  } catch (error: any) {
    if (error.code === "P2025") {
      res.status(404).json({ message: "Siswa tidak ditemukan" });
      return;
    }
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

export default router;
