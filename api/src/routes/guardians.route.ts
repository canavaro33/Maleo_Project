import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { verifyJWT } from "../middleware/auth";
import { checkRole } from "../middleware/role";
import { validate } from "../middleware/validate";
import bcrypt from "bcryptjs";
import { generateUniqueUserCode } from "../lib/userCode";

const router = Router();

const guardianSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  phone: z.string().min(1, "Telepon wajib diisi"),
  email: z.string().email("Email tidak valid"),
  address: z.string().min(1, "Alamat wajib diisi"),
  occupation: z.string().min(1, "Pekerjaan wajib diisi"),
});

// GET /api/guardians
router.get("/", verifyJWT, async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: "insensitive" } },
        { phone: { contains: String(search) } },
      ];
    }
    const guardians = await prisma.guardian.findMany({
      where,
      include: {
        students: {
          select: { id: true, name: true, class: { select: { name: true } } },
        },
      },
      orderBy: { name: "asc" },
    });

    // Ambil data userCode dari tabel User berdasarkan Phone (yang disimpan di nipNis)
    const phones = guardians.map(g => g.phone);
    const users = await prisma.user.findMany({
      where: { role: "guardian", nipNis: { in: phones } },
      select: { nipNis: true, userCode: true }
    });

    const result = guardians.map((g) => {
      const user = users.find(u => u.nipNis === g.phone);
      return {
        id: g.id,
        name: g.name,
        phone: g.phone,
        email: g.email,
        address: g.address,
        occupation: g.occupation,
        userCode: user?.userCode || null,
        children: g.students.map((s) => ({ id: s.id, name: s.name, className: s.class.name })),
      };
    });

    res.json({ success: true, data: result, total: result.length });
  } catch (error) {
    console.error("[Guardians] GET error:", error);
    res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
});

// GET /api/guardians/:id
router.get("/:id", verifyJWT, async (req: Request, res: Response) => {
  try {
    const guardian = await prisma.guardian.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        students: {
          select: { id: true, name: true, class: { select: { name: true } } },
        },
      },
    });
    if (!guardian) {
      res.status(404).json({ success: false, message: "Wali murid tidak ditemukan" });
      return;
    }
    res.json({ success: true, data: guardian });
  } catch (error) {
    console.error("[Guardians] GET by ID error:", error);
    res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
});

// POST /api/guardians
router.post(
  "/",
  verifyJWT,
  checkRole("super_admin", "admin"),
  validate(guardianSchema),
  async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const { name, email, phone } = data;

      // 1. Generate unique 3-digit userCode otomatis
      const userCode = await generateUniqueUserCode("guardian");

      // 2. Generate default password (e.g. O001)
      const defaultPassword = `O${userCode}`;
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(defaultPassword, salt);

      // 3. Gunakan Transaction untuk membuat Guardian dan User Akun sekaligus
      const result = await prisma.$transaction(async (tx) => {
        // Buat Akun User untuk Login (Identifier adalah phone)
        await tx.user.create({
          data: {
            name,
            email,
            nipNis: phone, 
            userCode,
            password: hashedPassword,
            role: "guardian",
          },
        });

        // Buat Profil Guardian
        const guardian = await tx.guardian.create({
          data: data,
        });

        return { guardian };
      });

      res.status(201).json({ 
        success: true, 
        message: `Wali murid berhasil ditambahkan. Akun login otomatis dibuat dengan Password: ${defaultPassword}`, 
        data: result.guardian 
      });
    } catch (error: any) {
      if (error.code === "P2002") {
        res.status(400).json({ success: false, message: "Nomor telepon atau email sudah digunakan" });
        return;
      }
      console.error("[Guardians] POST error:", error);
      res.status(500).json({ success: false, message: "Terjadi kesalahan server saat membuat data wali murid" });
    }
  }
);

// PUT /api/guardians/:id
router.put(
  "/:id",
  verifyJWT,
  checkRole("super_admin", "admin"),
  validate(guardianSchema.partial()),
  async (req: Request, res: Response) => {
    try {
      const guardian = await prisma.guardian.update({
        where: { id: Number(req.params.id) },
        data: req.body,
      });
      res.json({ success: true, message: "Wali murid berhasil diperbarui", data: guardian });
    } catch (error: any) {
      if (error.code === "P2025") {
        res.status(404).json({ success: false, message: "Wali murid tidak ditemukan" });
        return;
      }
      res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
    }
  }
);

// DELETE /api/guardians/:id
router.delete(
  "/:id",
  verifyJWT,
  checkRole("super_admin", "admin"),
  async (req: Request, res: Response) => {
    try {
      await prisma.guardian.delete({ where: { id: Number(req.params.id) } });
      res.json({ success: true, message: "Wali murid berhasil dihapus" });
    } catch (error: any) {
      if (error.code === "P2025") {
        res.status(404).json({ success: false, message: "Wali murid tidak ditemukan" });
        return;
      }
      res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
    }
  }
);

export default router;
