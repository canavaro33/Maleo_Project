import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    // 1. Counts
    const [totalStudents, totalTeachers, totalClasses, totalSubjects] = await Promise.all([
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.class.count(),
      prisma.subject.count(),
    ]);

    // 2. Attendance Average
    const attendanceStats = await prisma.attendance.aggregate({
      _count: { id: true },
      // Simple logic: we want to find percentage of 'hadir'
    });

    const presentCount = await prisma.attendance.count({
      where: { status: "hadir" }
    });

    const attendanceRate = attendanceStats._count.id > 0 
      ? (presentCount / attendanceStats._count.id) * 100 
      : 0;

    // 3. Grade Average
    const gradeStats = await prisma.grade.aggregate({
      _avg: { score: true }
    });

    // 4. Academic Year
    const activeAcademicYear = await prisma.academicYear.findFirst({
      where: { isActive: true }
    });

    // 5. Recent Announcements
    const recentAnnouncements = await prisma.announcement.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      take: 4
    });

    res.json({
      success: true,
      data: {
        totalStudents,
        totalTeachers,
        totalClasses,
        totalSubjects,
        attendanceRate: parseFloat(attendanceRate.toFixed(1)),
        averageScore: parseFloat((gradeStats._avg.score || 0).toFixed(1)),
        academicYear: activeAcademicYear?.name || "N/A",
        recentAnnouncements
      }
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ success: false, message: "Gagal mengambil data dashboard" });
  }
};
