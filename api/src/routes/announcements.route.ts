import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { verifyJWT } from "../middleware/auth";
import { checkRole } from "../middleware/role";
import { validate } from "../middleware/validate";

const router = Router();

const announcementSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  author: z.string().min(1),
  target: z.enum(["all", "teacher", "student", "guardian"]).optional(),
  priority: z.enum(["normal", "important", "urgent"]).optional(),
  isPublished: z.boolean().optional(),
});

router.get("/", verifyJWT, async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const where: any = {};
    if (search) where.title = { contains: String(search), mode: "insensitive" };

    const announcements = await prisma.announcement.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    const result = announcements.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString().split("T")[0],
    }));
    res.json({ data: result, total: result.length });
  } catch (error) { res.status(500).json({ message: "Terjadi kesalahan server" }); }
});

router.post("/", verifyJWT, checkRole("super_admin", "admin"), validate(announcementSchema), async (req: Request, res: Response) => {
  try {
    const ann = await prisma.announcement.create({ data: req.body });
    res.status(201).json({ message: "Pengumuman berhasil dibuat", data: ann });
  } catch (error) { res.status(500).json({ message: "Terjadi kesalahan server" }); }
});

router.put("/:id", verifyJWT, checkRole("super_admin", "admin"), validate(announcementSchema.partial()), async (req: Request, res: Response) => {
  try {
    const ann = await prisma.announcement.update({ where: { id: Number(req.params.id) }, data: req.body });
    res.json({ message: "Pengumuman berhasil diperbarui", data: ann });
  } catch (error: any) {
    if (error.code === "P2025") { res.status(404).json({ message: "Pengumuman tidak ditemukan" }); return; }
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

router.delete("/:id", verifyJWT, checkRole("super_admin", "admin"), async (req: Request, res: Response) => {
  try {
    await prisma.announcement.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Pengumuman berhasil dihapus" });
  } catch (error: any) {
    if (error.code === "P2025") { res.status(404).json({ message: "Pengumuman tidak ditemukan" }); return; }
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

export default router;
