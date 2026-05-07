import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import { verifyJWT } from "../middleware/auth";
import { checkRole } from "../middleware/role";
import { validate } from "../middleware/validate";
import { generateUniqueUserCode } from "../lib/userCode";

const router = Router();

const studentSchema = z.object({
  nis: z.string().min(1, "NIS wajib diisi"),
  name: z.string().min(1, "Nama wajib diisi"),
  gender: z.enum(["L", "P"]),
  birthDate: z.string().min(1, "Tanggal lahir wajib diisi"),
  address: z.string().min(1, "Alamat wajib diisi").optional().or(z.literal("")),
  phone: z.string().min(1, "Telepon wajib diisi").optional().or(z.literal("")),
  classId: z.coerce.number().int().positive("Kelas harus dipilih"),
  status: z.enum(["active", "inactive"]).optional(),
});

// GET /api/students
router.get("/", verifyJWT, async (req: Request, res: Response) => {
  try {
    const { search, className } = req.query;
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: "insensitive" } },
        { nis: { contains: String(search) } },
      ];
    }
    if (className) {
      where.class = { name: String(className) };
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        class: { select: { id: true, name: true } },
        guardians: { select: { id: true, name: true } },
        user: { select: { userCode: true } },
      },
      orderBy: { name: "asc" },
    });

    // Ambil userCode via relasi user pada student
    const result = students.map((s) => ({
      id: s.id,
      nis: s.nis,
      name: s.name,
      gender: s.gender,
      birthDate: s.birthDate ? s.birthDate.toISOString().split("T")[0] : null,
      address: s.address,
      phone: s.phone,
      classId: s.classId,
      className: s.class.name,
      status: s.status,
      userCode: (s as any).user?.userCode || null,
      guardians: s.guardians.map((g) => ({ id: g.id, name: g.name })),
    }));

    res.json({ success: true, data: result, total: result.length });
  } catch (error) {
    console.error("[Students] GET error:", error);
    res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
});

// GET /api/students/:id
router.get("/:id", verifyJWT, async (req: Request, res: Response) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        class: { select: { id: true, name: true } },
        guardians: { select: { id: true, name: true, phone: true, email: true } },
      },
    });
    if (!student) {
      res.status(404).json({ success: false, message: "Siswa tidak ditemukan" });
      return;
    }
    res.json({ success: true, data: student });
  } catch (error) {
    console.error("[Students] GET by ID error:", error);
    res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
});

// POST /api/students
router.post(
  "/",
  verifyJWT,
  checkRole("super_admin", "admin"),
  validate(studentSchema),
  async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const { nis, name } = data;

      // 1. Generate unique 3-digit userCode otomatis
      const userCode = await generateUniqueUserCode("student");

      // 2. Generate Default Password (e.g. S001)
      const defaultPassword = `S${userCode}`;
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(defaultPassword, salt);

      // 3. Transaction: buat Student dulu, dapat id-nya, baru buat User dengan studentId FK
      const result = await prisma.$transaction(async (tx) => {
        // Buat Profil Student terlebih dahulu
        const student = await tx.student.create({
          data: {
            ...data,
            birthDate: new Date(data.birthDate),
          },
        });

        // Buat Akun User dengan FK studentId
        await tx.user.create({
          data: {
            name,
            nipNis: nis,
            userCode,
            password: hashedPassword,
            role: "student",
            studentId: student.id,
          },
        });

        return { student };
      });

      res.status(201).json({ 
        success: true, 
        message: `Siswa berhasil ditambahkan. Akun login otomatis dibuat dengan Password: ${defaultPassword}`, 
        data: result.student 
      });
    } catch (error: any) {
      if (error.code === "P2002") {
        res.status(400).json({ success: false, message: "NIS sudah digunakan di sistem" });
        return;
      }
      console.error("[Students] POST error:", error);
      res.status(500).json({ success: false, message: "Terjadi kesalahan server saat membuat data siswa" });
    }
  }
);

// PUT /api/students/:id
router.put(
  "/:id",
  verifyJWT,
  checkRole("super_admin", "admin"),
  validate(studentSchema.partial()),
  async (req: Request, res: Response) => {
    try {
      const data = req.body;
      if (data.birthDate) data.birthDate = new Date(data.birthDate);

      const student = await prisma.student.update({
        where: { id: Number(req.params.id) },
        data,
      });
      res.json({ success: true, message: "Siswa berhasil diperbarui", data: student });
    } catch (error: any) {
      if (error.code === "P2025") {
        res.status(404).json({ success: false, message: "Siswa tidak ditemukan" });
        return;
      }
      res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
    }
  }
);

// DELETE /api/students/:id
router.delete(
  "/:id",
  verifyJWT,
  checkRole("super_admin", "admin"),
  async (req: Request, res: Response) => {
    try {
      await prisma.student.delete({ where: { id: Number(req.params.id) } });
      res.json({ success: true, message: "Siswa berhasil dihapus" });
    } catch (error: any) {
      if (error.code === "P2025") {
        res.status(404).json({ success: false, message: "Siswa tidak ditemukan" });
        return;
      }
      res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
    }
  }
);

export default router;
