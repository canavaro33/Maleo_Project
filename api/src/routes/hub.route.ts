import { Router, Request, Response } from "express";
import path from "path";
import { prisma } from "../lib/prisma";
import { verifyJWT, AuthRequest } from "../middleware/auth";
import { uploadMaterial } from "../lib/multer";

const router = Router();

/**
 * Middleware untuk mendapatkan identitas tambahan (teacherId atau studentId & classId)
 * berdasarkan role user yang sedang login.
 */
const identityGuard = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: { nipNis: true, role: true }
    });

    if (!user || !user.nipNis) {
      return res.status(404).json({ success: false, message: "Profil user tidak lengkap." });
    }

    if (user.role === "teacher") {
      const teacher = await prisma.teacher.findUnique({ where: { nip: user.nipNis } });
      if (teacher) (req as any).teacherId = teacher.id;
    } else if (user.role === "student") {
      const student = await prisma.student.findUnique({ where: { nis: user.nipNis } });
      if (student) {
        (req as any).studentId = student.id;
        (req as any).classId = student.classId;
      }
    }
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: "Terjadi kesalahan identitas." });
  }
};

router.use(verifyJWT);
router.use(identityGuard);

// 1. GET /api/hub/dashboard
router.get("/dashboard", async (req: any, res: Response) => {
  try {
    const { role } = req.user;
    const today = new Date();
    const dayName = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][today.getDay()];

    let stats = { subjects: 0, activeAssignments: 0, attendanceRate: 100, averageGrade: 0 };
    let schedules: any[] = [];

    if (role === "teacher") {
      const teacherId = req.teacherId;
      const [subjectCount, assignmentCount, daySchedules, grades] = await Promise.all([
        prisma.subject.count({ where: { teacherId } }),
        prisma.assignment.count({ where: { teacherId, dueDate: { gte: today } } }),
        prisma.schedule.findMany({
          where: { teacherId, day: dayName },
          include: { class: true, subject: true },
          orderBy: { startTime: "asc" }
        }),
        prisma.grade.aggregate({ where: { subject: { teacherId } }, _avg: { score: true } })
      ]);
      stats = { 
        subjects: subjectCount, 
        activeAssignments: assignmentCount, 
        attendanceRate: 98, 
        averageGrade: grades._avg.score || 0 
      };
      schedules = daySchedules;
    } else if (role === "student") {
      const classId = req.classId;
      const studentId = req.studentId;
      const [assignmentCount, daySchedules, grades, attendances] = await Promise.all([
        prisma.assignment.count({ where: { classId, dueDate: { gte: today } } }),
        prisma.schedule.findMany({
          where: { classId, day: dayName },
          include: { teacher: true, subject: true },
          orderBy: { startTime: "asc" }
        }),
        prisma.grade.aggregate({ where: { studentId }, _avg: { score: true } }),
        prisma.attendance.findMany({ where: { studentId, date: { gte: new Date(today.getFullYear(), today.getMonth(), 1) } } })
      ]);
      
      const presentCount = attendances.filter(a => a.status === 'hadir').length;
      const attRate = attendances.length > 0 ? (presentCount / attendances.length) * 100 : 100;

      stats = { 
        subjects: 0,
        activeAssignments: assignmentCount, 
        attendanceRate: Math.round(attRate), 
        averageGrade: grades._avg.score || 0 
      };
      schedules = daySchedules;
    }

    res.json({
      success: true,
      data: {
        stats,
        todaySchedules: schedules.map((s: any) => ({
          time: `${s.startTime} - ${s.endTime}`,
          subject: s.subject.name,
          class: s.class?.name || "Semua",
          teacher: s.teacher?.name || "",
          room: s.room
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil data dashboard." });
  }
});

// 2. GET /api/hub/announcements
router.get("/announcements", async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role;
    const announcements = await prisma.announcement.findMany({
      where: {
        isPublished: true,
        OR: [
          { target: "all" },
          { target: role as any }
        ]
      },
      orderBy: { createdAt: "desc" },
      take: 5
    });
    res.json({ success: true, data: announcements });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil pengumuman." });
  }
});

// 3. GET & POST /api/hub/contents
router.get("/contents", async (req: any, res: Response) => {
  try {
    const { role } = req.user;
    let where = {};

    if (role === "teacher") {
      where = { teacherId: req.teacherId };
    } else if (role === "student") {
      where = { classId: req.classId };
    }

    const contents = await prisma.content.findMany({
      where,
      include: { 
        teacher: { select: { name: true } }, 
        subject: { select: { name: true } },
        class: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json({ success: true, data: contents });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil data materi." });
  }
});

router.post("/contents", async (req: any, res: Response) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ success: false, message: "Akses ditolak: Hanya Guru yang dapat mengunggah data." });
    }
    const { title, type, url, classId, subjectId } = req.body;
    const content = await prisma.content.create({
      data: { title, type, url, teacherId: req.teacherId, classId: Number(classId), subjectId: Number(subjectId) }
    });
    res.status(201).json({ success: true, message: "Materi berhasil diunggah", data: content });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengunggah materi." });
  }
});

// 4. GET & POST /api/hub/assignments
router.get("/assignments", async (req: any, res: Response) => {
  try {
    const { role } = req.user;
    let where = {};

    if (role === "teacher") {
      where = { teacherId: req.teacherId };
    } else if (role === "student") {
      where = { classId: req.classId };
    }

    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        teacher: { select: { name: true } },
        subject: { select: { name: true } },
        class: {
          select: {
            name: true,
            _count: { select: { students: true } } // totalStudents
          }
        }
      },
      orderBy: { dueDate: "asc" }
    });

    const result = assignments.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      dueDate: a.dueDate,
      fileUrl: a.fileUrl,
      fileType: a.fileType,
      teacher: a.teacher,
      subject: { id: a.subjectId, name: a.subject.name },
      class: { id: a.classId, name: a.class.name },
      totalStudents: a.class._count.students,
      submittedCount: 0, // Sprint 3
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil data tugas." });
  }
});

router.post("/assignments", async (req: any, res: Response) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ success: false, message: "Akses ditolak: Hanya Guru yang dapat membuat tugas." });
    }
    const { title, description, dueDate, classId, subjectId, fileUrl, fileType } = req.body;
    const assignment = await prisma.assignment.create({
      data: {
        title, description, dueDate: new Date(dueDate),
        fileUrl, fileType,
        teacherId: req.teacherId, classId: Number(classId), subjectId: Number(subjectId)
      }
    });
    res.status(201).json({ success: true, message: "Tugas berhasil dibuat", data: assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal membuat tugas." });
  }
});

router.post("/assignments/upload", uploadMaterial.single("file"), async (req: any, res: Response) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ success: false, message: "Akses ditolak." });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Tidak ada file yang diunggah." });
    }

    const fileUrl = `/uploads/materials/${req.file.filename}`;
    const fileType = path.extname(req.file.originalname).replace(".", "").toLowerCase();

    res.json({ success: true, fileUrl, fileType });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengunggah file." });
  }
});

router.put("/assignments/:id", async (req: any, res: Response) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ success: false, message: "Akses ditolak." });
    }

    const { title, description, dueDate, classId, subjectId, fileUrl, fileType } = req.body;
    const assignmentId = Number(req.params.id);

    // Pastikan tugas ini milik guru yang login
    const existing = await prisma.assignment.findFirst({
      where: { id: assignmentId, teacherId: req.teacherId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Tugas tidak ditemukan." });
    }

    const updated = await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        title,
        description,
        dueDate: new Date(dueDate),
        classId: Number(classId),
        subjectId: Number(subjectId),
        fileUrl,
        fileType,
      }
    });

    res.json({ success: true, message: "Tugas berhasil diperbarui", data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal memperbarui tugas." });
  }
});

router.delete("/assignments/:id", async (req: any, res: Response) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ success: false, message: "Akses ditolak." });
    }

    const assignmentId = Number(req.params.id);

    // Pastikan tugas ini milik guru yang login
    const existing = await prisma.assignment.findFirst({
      where: { id: assignmentId, teacherId: req.teacherId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Tugas tidak ditemukan." });
    }

    await prisma.assignment.delete({ where: { id: assignmentId } });

    res.json({ success: true, message: "Tugas berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menghapus tugas." });
  }
});

router.get("/assignments/:id", async (req: any, res: Response) => {
  try {
    const assignmentId = Number(req.params.id);

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        teacher: { select: { name: true } },
        subject: { select: { id: true, name: true } },
        class: {
          select: {
            id: true,
            name: true,
            _count: { select: { students: true } }
          }
        }
      }
    });

    if (!assignment) {
      return res.status(404).json({ success: false, message: "Tugas tidak ditemukan." });
    }

    res.json({
      success: true,
      data: {
        ...assignment,
        fileUrl: assignment.fileUrl,
        fileType: assignment.fileType,
        totalStudents: assignment.class._count.students,
        submittedCount: 0, // Sprint 3
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil detail tugas." });
  }
});

// GET /api/hub/teacher-classes → kelas yang diajar guru ini
router.get("/teacher-classes", async (req: any, res: Response) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ success: false, message: "Akses ditolak." });
    }

    const teacherId = req.teacherId;

    // 1. Ambil kelas dari jadwal guru
    const schedules = await prisma.schedule.findMany({
      where: { teacherId },
      select: { class: { select: { id: true, name: true } } },
      distinct: ['classId']
    });

    // 2. Ambil kelas di mana guru adalah wali kelas
    const homeroomClasses = await prisma.class.findMany({
      where: { homeroomTeacherId: teacherId },
      select: { id: true, name: true }
    });

    // 3. Ambil kelas berdasarkan tingkatan mata pelajaran yang diajar
    const subjects = await prisma.subject.findMany({
      where: { teacherId },
      select: { gradeLevel: true }
    });
    const gradeLevels = subjects.map(s => s.gradeLevel);
    
    const subjectLevelClasses = await prisma.class.findMany({
      where: { level: { in: gradeLevels } },
      select: { id: true, name: true }
    });

    // Gabungkan semua dan hilangkan duplikat
    const classMap = new Map();
    schedules.forEach(s => {
      if (s.class) classMap.set(s.class.id, s.class);
    });
    homeroomClasses.forEach(c => {
      classMap.set(c.id, c);
    });
    subjectLevelClasses.forEach(c => {
      classMap.set(c.id, c);
    });

    const result = Array.from(classMap.values());
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil data kelas." });
  }
});

// GET /api/hub/teacher-subjects → mata pelajaran yang diajar guru ini
router.get("/teacher-subjects", async (req: any, res: Response) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ success: false, message: "Akses ditolak." });
    }

    const subjects = await prisma.subject.findMany({
      where: { teacherId: req.teacherId },
      select: { id: true, name: true }
    });

    res.json({ success: true, data: subjects });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil data mata pelajaran." });
  }
});

// 5. GET /api/hub/schedules
router.get("/schedules", async (req: any, res: Response) => {
  try {
    const { role } = req.user;
    let where = {};

    if (role === "teacher") {
      where = { teacherId: req.teacherId };
    } else if (role === "student") {
      where = { classId: req.classId };
    }

    const schedules = await prisma.schedule.findMany({
      where,
      include: { 
        subject: { select: { name: true } }, 
        teacher: { select: { name: true } }, 
        class: { select: { name: true } } 
      },
      orderBy: [
        { day: "asc" },
        { startTime: "asc" }
      ]
    });
    res.json({ success: true, data: schedules });
  } catch (error) {
    console.error("[Hub] Schedules error:", error);
    res.status(500).json({ success: false, message: "Gagal mengambil data jadwal." });
  }
});

export default router;
