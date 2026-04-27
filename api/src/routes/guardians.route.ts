import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { verifyJWT } from "../middleware/auth";
import { checkRole } from "../middleware/role";
import { validate } from "../middleware/validate";

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
          select: { id: true, name: true, grade: { select: { name: true } } },
        },
      },
      orderBy: { name: "asc" },
    });

    const result = guardians.map((g) => ({
      id: g.id,
      name: g.name,
      phone: g.phone,
      email: g.email,
      address: g.address,
      occupation: g.occupation,
      children: g.students.map((s) => ({ id: s.id, name: s.name, grade: s.grade.name })),
    }));

    res.json({ data: result, total: result.length });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

// GET /api/guardians/:id
router.get("/:id", verifyJWT, async (req: Request, res: Response) => {
  try {
    const guardian = await prisma.guardian.findUnique({
      where: { id: Number(req.params.id) },
      include: { students: { select: { id: true, name: true, grade: { select: { name: true } } } } },
    });
    if (!guardian) { res.status(404).json({ message: "Wali murid tidak ditemukan" }); return; }
    res.json({ data: guardian });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

// POST /api/guardians
router.post("/", verifyJWT, checkRole("super_admin", "admin"), validate(guardianSchema), async (req: Request, res: Response) => {
  try {
    const guardian = await prisma.guardian.create({ data: req.body });
    res.status(201).json({ message: "Wali murid berhasil ditambahkan", data: guardian });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

// PUT /api/guardians/:id
router.put("/:id", verifyJWT, checkRole("super_admin", "admin"), validate(guardianSchema.partial()), async (req: Request, res: Response) => {
  try {
    const guardian = await prisma.guardian.update({ where: { id: Number(req.params.id) }, data: req.body });
    res.json({ message: "Wali murid berhasil diperbarui", data: guardian });
  } catch (error: any) {
    if (error.code === "P2025") { res.status(404).json({ message: "Wali murid tidak ditemukan" }); return; }
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

// DELETE /api/guardians/:id
router.delete("/:id", verifyJWT, checkRole("super_admin", "admin"), async (req: Request, res: Response) => {
  try {
    await prisma.guardian.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Wali murid berhasil dihapus" });
  } catch (error: any) {
    if (error.code === "P2025") { res.status(404).json({ message: "Wali murid tidak ditemukan" }); return; }
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

export default router;
