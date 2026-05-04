import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { verifyJWT } from "../middleware/auth";
import { checkRole } from "../middleware/role";
import { validate } from "../middleware/validate";
import bcrypt from "bcryptjs";
import { generateUniqueUserCode } from "../lib/userCode";

const router = Router();

const teacherSchema = z.object({
  nip: z.string().min(1, "NIP wajib diisi"),
  name: z.string().min(1, "Nama wajib diisi"),
  gender: z.enum(["L", "P"]),
  email: z.string().email("Email tidak valid"),
  phone: z.string().min(1, "Telepon wajib diisi"),
  subject: z.string().optional().or(z.literal("")),
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
    
    // Ambil data userCode dari tabel User berdasarkan NIP
    const nips = teachers.map(t => t.nip);
    const users = await prisma.user.findMany({
      where: { role: "teacher", nipNis: { in: nips } },
      select: { nipNis: true, userCode: true }
    });
    
    const result = teachers.map(t => {
      const user = users.find(u => u.nipNis === t.nip);
      return { ...t, userCode: user?.userCode || null };
    });

    res.json({ data: result, total: teachers.length });
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
    const data = req.body;
    const { nip, name, email } = data;

    // 1. Generate unique 3-digit userCode otomatis
    const userCode = await generateUniqueUserCode("teacher");

    // 2. Generate default password (e.g. G001)
    const defaultPassword = `G${userCode}`;
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    // 3. Gunakan Transaction untuk membuat Teacher dan User Akun sekaligus
    const result = await prisma.$transaction(async (tx) => {
      // Buat Akun User untuk Login
      await tx.user.create({
        data: {
          name,
          email,
          nipNis: nip,
          userCode,
          password: hashedPassword,
          role: "teacher",
        },
      });

      // Buat Profil Teacher
      const teacher = await tx.teacher.create({
        data,
      });

      return { teacher };
    });

    res.status(201).json({ 
      success: true,
      message: `Guru berhasil ditambahkan. Akun login otomatis dibuat dengan Password: ${defaultPassword}`, 
      data: result.teacher 
    });
  } catch (error: any) {
    if (error.code === "P2002") { 
      res.status(400).json({ success: false, message: "NIP atau email sudah digunakan" }); 
      return; 
    }
    console.error("[Teachers] POST error:", error);
    res.status(500).json({ success: false, message: "Terjadi kesalahan server saat membuat data guru" });
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
    const id = Number(req.params.id);

    // 1. Pengecekan Relasi (Safe Delete)
    const [hasSubjects, hasSchedules, hasHomeroom] = await Promise.all([
      prisma.subject.findFirst({ where: { teacherId: id } }),
      prisma.schedule.findFirst({ where: { teacherId: id } }),
      prisma.class.findFirst({ where: { homeroomTeacherId: id } }),
    ]);

    if (hasSubjects || hasSchedules || hasHomeroom) {
      return res.status(400).json({ 
        success: false,
        message: "Tidak dapat menghapus data: Guru yang bersangkutan masih memiliki beban mengajar atau terdaftar sebagai Wali Kelas. Silakan kosongkan atau pindahkan data terlebih dahulu." 
      });
    }

    // 2. Hapus data (User akun akan tetap ada atau bisa dihapus manual di menu User)
    await prisma.teacher.delete({ where: { id } });
    
    res.json({ success: true, message: "Guru berhasil dihapus" });
  } catch (error: any) {
    if (error.code === "P2025") { res.status(404).json({ success: false, message: "Guru tidak ditemukan" }); return; }
    console.error("[Teachers] DELETE error:", error);
    res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
});

export default router;
