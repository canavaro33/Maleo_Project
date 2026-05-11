import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { verifyJWT } from "../middleware/auth";
import { checkRole } from "../middleware/role";

const router = Router();

// ─────────────────────────────────────────────────────────
// GET /api/principal/summary
// Hanya kepala_sekolah dan admin yang boleh akses
// ─────────────────────────────────────────────────────────
router.get(
  "/summary",
  verifyJWT,
  checkRole("kepala_sekolah", "admin"),
  async (req: Request, res: Response) => {
    try {
      const startOfMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      );

      const [
        totalStudents,
        totalTeachers,
        totalClasses,
        totalSubjects,
        activeYear,
        recentAnnouncements,
        topStudentsRaw,
        totalAttendances,
        hadirCount,
        avgScore,
      ] = await Promise.all([
        prisma.student.count({ where: { status: "active" } }),
        prisma.teacher.count({ where: { status: "active" } }),
        prisma.class.count(),
        prisma.subject.count(),
        prisma.academicYear.findFirst({ where: { isActive: true } }),
        prisma.announcement.findMany({
          where: { isPublished: true },
          orderBy: { createdAt: "desc" },
          take: 3,
        }),
        // Top 4 siswa berdasarkan rata-rata nilai
        prisma.grade.groupBy({
          by: ["studentId"],
          _avg: { score: true },
          orderBy: { _avg: { score: "desc" } },
          take: 4,
        }),
        // Attendance count bulan ini
        prisma.attendance.count({
          where: { date: { gte: startOfMonth } },
        }),
        // Hadir count bulan ini
        prisma.attendance.count({
          where: { date: { gte: startOfMonth }, status: "hadir" },
        }),
        // Rata-rata nilai global
        prisma.grade.aggregate({ _avg: { score: true } }),
      ]);

      // Attendance rate global
      const attendanceRate =
        totalAttendances > 0
          ? Math.round((hadirCount / totalAttendances) * 100)
          : 0;

      // Format topStudents dengan nama + kelas
      const topStudents = await Promise.all(
        topStudentsRaw.map(async (g) => {
          const student = await prisma.student.findUnique({
            where: { id: g.studentId },
            select: { name: true, class: { select: { name: true } } },
          });
          return {
            name: student?.name ?? "—",
            className: student?.class?.name ?? "—",
            avgScore: Math.round((g._avg.score || 0) * 10) / 10,
          };
        })
      );

      // Kehadiran per kelas bulan ini
      const attendancesByClass = await prisma.attendance.findMany({
        where: { date: { gte: startOfMonth } },
        include: {
          student: { select: { class: { select: { name: true } } } },
        },
      });

      // Group kehadiran per kelas
      const classMap: Record<
        string,
        { present: number; total: number }
      > = {};
      for (const a of attendancesByClass) {
        const className = a.student?.class?.name ?? "Unknown";
        if (!classMap[className]) {
          classMap[className] = { present: 0, total: 0 };
        }
        classMap[className].total++;
        if (a.status === "hadir") classMap[className].present++;
      }

      const attendanceByClass = Object.entries(classMap).map(
        ([className, val]) => ({
          className,
          rate: Math.round((val.present / val.total) * 100),
          presentDays: val.present,
          totalDays: val.total,
        })
      );

      const lowAttendanceAlert = attendanceByClass.filter((c) => c.rate < 80);

      // Data untuk guru
      const teacherAttendanceThisMonth = await prisma.teacherAttendance.findMany({
        where: { date: { gte: startOfMonth } }
      });

      const teacherHadirCount = teacherAttendanceThisMonth.filter(
        a => a.status === 'hadir' || a.status === 'terlambat'
      ).length;

      const teacherAttendanceRate = teacherAttendanceThisMonth.length > 0
        ? Math.round((teacherHadirCount / teacherAttendanceThisMonth.length) * 100)
        : 0;

      // Alert siswa berisiko (kehadiran < 75% bulan ini)
      const studentAttendanceByStudent = await prisma.attendance.groupBy({
        by: ['studentId'],
        where: { date: { gte: startOfMonth } },
        _count: { status: true },
      });

      const atRiskStudents = await Promise.all(
        studentAttendanceByStudent
          .filter(s => s._count.status > 0)
          .map(async (s) => {
            const hadir = await prisma.attendance.count({
              where: {
                studentId: s.studentId,
                date: { gte: startOfMonth },
                status: 'hadir'
              }
            });
            const total = s._count.status;
            const rate = Math.round((hadir / total) * 100);

            if (rate < 75) {
              const student = await prisma.student.findUnique({
                where: { id: s.studentId },
                select: {
                  name: true,
                  class: { select: { name: true } },
                  guardians: { select: { name: true, phone: true } }
                }
              });
              return {
                studentId: s.studentId,
                name: student?.name,
                className: student?.class?.name,
                attendanceRate: rate,
                guardian: student?.guardians?.[0] || null,
              };
            }
            return null;
          })
      );

      const filteredAtRisk = atRiskStudents.filter(Boolean);

      res.json({
        success: true,
        data: {
          totalStudents,
          totalTeachers,
          totalClasses,
          totalSubjects,
          attendanceRate,
          averageScore:
            Math.round((avgScore._avg.score || 0) * 10) / 10,
          academicYear: activeYear
            ? `${activeYear.name} - ${activeYear.semester}`
            : "-",
          recentAnnouncements,
          topStudents,
          attendanceByClass,
          lowAttendanceAlert,
          teacherAttendanceRate,
          atRiskStudents: filteredAtRisk,
          atRiskCount: filteredAtRisk.length,
        },
      });
    } catch (error) {
      console.error("[Principal] GET summary error:", error);
      res
        .status(500)
        .json({ success: false, message: "Terjadi kesalahan server" });
    }
  }
);

export default router;
