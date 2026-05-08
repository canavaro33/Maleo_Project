import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { verifyJWT } from "../middleware/auth";
import { checkRole } from "../middleware/role";
import { validate } from "../middleware/validate";
import bcrypt from "bcryptjs";

const router = Router();

// Validation Schema
const principalSchema = z.object({
  nip: z.string().min(1, "NIP wajib diisi"),
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Format email tidak valid"),
  phone: z.string().optional().nullable(),
});

// ─────────────────────────────────────────────────────────
// GET /api/principals
// ─────────────────────────────────────────────────────────
router.get("/", verifyJWT, checkRole("admin"), async (req: Request, res: Response) => {
  try {
    const principals = await prisma.principal.findMany({
      include: { user: true },
      orderBy: { name: "asc" },
    });

    // Format response to include email from user
    const formatted = principals.map((p) => ({
      id: p.id,
      nip: p.nip,
      name: p.name,
      phone: p.phone,
      email: p.user?.email || "-",
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error("[Principals] GET error:", error);
    res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/principals
// ─────────────────────────────────────────────────────────
router.post("/", verifyJWT, checkRole("admin"), validate(principalSchema), async (req: Request, res: Response) => {
  try {
    const { nip, name, email, phone } = req.body;

    // 1. Check if email or nip already used
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ success: false, message: "Email sudah digunakan" });
      return;
    }

    const existingPrincipal = await prisma.principal.findUnique({ where: { nip } });
    if (existingPrincipal) {
      res.status(400).json({ success: false, message: "NIP sudah terdaftar" });
      return;
    }

    // 2. Generate Default Password: K + random 3 digit
    const randomDigits = Math.floor(100 + Math.random() * 900);
    const defaultPassword = `K${randomDigits}`;
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // 3. Database Transaction
    const result = await prisma.$transaction(async (tx) => {
      // a. Create Principal
      const principal = await tx.principal.create({
        data: {
          nip,
          name,
          phone,
          principalCode: `PRIN-${nip}`, // internal code based on NIP
        },
      });

      // b. Create User
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "kepala_sekolah",
          userCode: nip, // Username = NIP
          principalId: principal.id,
          force_change_password: true,
          nipNis: nip,
        },
      });

      return { principal, user, defaultPassword };
    });

    res.status(201).json({
      success: true,
      message: "Kepala Sekolah berhasil ditambahkan",
      data: {
        id: result.principal.id,
        nip: result.principal.nip,
        name: result.principal.name,
        username: result.user.userCode,
        password: result.defaultPassword, // Shown only once
      },
    });
  } catch (error) {
    console.error("[Principals] POST error:", error);
    res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
});

// ─────────────────────────────────────────────────────────
// PUT /api/principals/:id
// ─────────────────────────────────────────────────────────
router.put("/:id", verifyJWT, checkRole("admin"), validate(principalSchema.partial()), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { name, phone, email } = req.body;

    // Check if principal exists
    const existing = await prisma.principal.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!existing) {
      res.status(404).json({ success: false, message: "Data tidak ditemukan" });
      return;
    }

    // Check email uniqueness if being changed
    if (email && email !== existing.user?.email) {
      const emailTaken = await prisma.user.findUnique({ where: { email } });
      if (emailTaken) {
        res.status(400).json({ success: false, message: "Email sudah digunakan oleh user lain" });
        return;
      }
    }

    await prisma.$transaction(async (tx) => {
      // Update Principal
      await tx.principal.update({
        where: { id },
        data: {
          name: name ?? undefined,
          phone: phone ?? undefined,
        },
      });

      // Update User
      if (existing.user) {
        await tx.user.update({
          where: { id: existing.user.id },
          data: {
            name: name ?? undefined,
            email: email ?? undefined,
          },
        });
      }
    });

    res.json({ success: true, message: "Data berhasil diperbarui" });
  } catch (error) {
    console.error("[Principals] PUT error:", error);
    res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
});

// ─────────────────────────────────────────────────────────
// DELETE /api/principals/:id
// ─────────────────────────────────────────────────────────
router.delete("/:id", verifyJWT, checkRole("admin"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const principal = await prisma.principal.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!principal) {
      res.status(404).json({ success: false, message: "Data tidak ditemukan" });
      return;
    }

    await prisma.$transaction(async (tx) => {
      // Delete user first (FK dependency)
      if (principal.user) {
        await tx.user.delete({ where: { id: principal.user.id } });
      }
      // Delete principal
      await tx.principal.delete({ where: { id } });
    });

    res.json({ success: true, message: "Data Kepala Sekolah berhasil dihapus" });
  } catch (error) {
    console.error("[Principals] DELETE error:", error);
    res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
});

export default router;
