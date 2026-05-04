import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { verifyJWT } from "../middleware/auth";
import { checkRole } from "../middleware/role";
import { validate } from "../middleware/validate";
import bcrypt from "bcryptjs";
import { generateUniqueUserCode } from "../lib/userCode";

const router = Router();

const principalSchema = z.object({
  nip: z.string().min(1, "NIP wajib diisi"),
  name: z.string().min(1, "Nama wajib diisi"),
});

// GET /api/principals
router.get("/", verifyJWT, checkRole("super_admin", "admin", "kepala_sekolah"), async (req: Request, res: Response) => {
  try {
    const principals = await prisma.principal.findMany({ orderBy: { name: "asc" } });
    res.json({ success: true, data: principals });
  } catch (error) {
    res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
});

// POST /api/principals
router.post("/", verifyJWT, checkRole("super_admin", "admin"), validate(principalSchema), async (req: Request, res: Response) => {
  try {
    const { nip, name } = req.body;

    // 1. Generate unique 3-digit userCode
    const userCode = await generateUniqueUserCode("kepala_sekolah");
    const principalCode = `K${userCode}`;

    // 2. Generate Default Password: K + userCode
    const defaultPassword = `K${userCode}`;
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // 3. Database Transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          nipNis: nip,
          userCode,
          password: hashedPassword,
          role: "kepala_sekolah",
          force_change_password: true,
        },
      });

      const principal = await tx.principal.create({
        data: { nip, name, principalCode },
      });

      return { principal, defaultPassword };
    });

    res.status(201).json({
      success: true,
      message: `Kepala Sekolah berhasil ditambahkan. Password default: ${result.defaultPassword}`,
      data: result.principal,
    });
  } catch (error: any) {
    console.error("[Principals] POST error:", error);
    if (error.code === "P2002") {
      res.status(400).json({ success: false, message: "NIP sudah digunakan di sistem" });
      return;
    }
    res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
});

// PUT /api/principals/:id
router.put("/:id", verifyJWT, checkRole("super_admin", "admin"), validate(principalSchema.partial()), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const data = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const principal = await tx.principal.update({ where: { id }, data });
      if (data.name) {
        await tx.user.update({ where: { nipNis: principal.nip }, data: { name: data.name } });
      }
      return principal;
    });

    res.json({ success: true, message: "Data berhasil diperbarui", data: result });
  } catch (error) {
    console.error("[Principals] PUT error:", error);
    res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
});

// POST /api/principals/:id/reset-password
router.post("/:id/reset-password", verifyJWT, checkRole("super_admin", "admin"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const principal = await prisma.principal.findUnique({ where: { id } });
    if (!principal) return res.status(404).json({ success: false, message: "Data tidak ditemukan" });

    const user = await prisma.user.findFirst({ where: { nipNis: principal.nip } });
    if (!user) return res.status(404).json({ success: false, message: "User tidak ditemukan" });

    const defaultPassword = `K${user.userCode}`;
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, force_change_password: true },
    });

    res.json({ success: true, message: `Password berhasil direset ke format default (${defaultPassword})` });
  } catch (error) {
    res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
});

// DELETE /api/principals/:id
router.delete("/:id", verifyJWT, checkRole("super_admin", "admin"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const principal = await prisma.principal.findUnique({ where: { id } });
    if (!principal) return res.status(404).json({ success: false, message: "Data tidak ditemukan" });

    await prisma.$transaction(async (tx) => {
      await tx.user.delete({ where: { nipNis: principal.nip } });
      await tx.principal.delete({ where: { id } });
    });

    res.json({ success: true, message: "Data Kepala Sekolah berhasil dihapus" });
  } catch (error) {
    console.error("[Principals] DELETE error:", error);
    res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
});

export default router;
