"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardSummary = void 0;
const prisma_1 = require("../lib/prisma");
const getDashboardSummary = async (req, res) => {
    try {
        // 1. Counts
        const [totalStudents, totalTeachers, totalClasses, totalSubjects] = await Promise.all([
            prisma_1.prisma.student.count(),
            prisma_1.prisma.teacher.count(),
            prisma_1.prisma.class.count(),
            prisma_1.prisma.subject.count(),
        ]);
        // 2. Attendance Average
        const attendanceStats = await prisma_1.prisma.attendance.aggregate({
            _count: { id: true },
            // Simple logic: we want to find percentage of 'hadir'
        });
        const presentCount = await prisma_1.prisma.attendance.count({
            where: { status: "hadir" }
        });
        const attendanceRate = attendanceStats._count.id > 0
            ? (presentCount / attendanceStats._count.id) * 100
            : 0;
        // 3. Grade Average
        const gradeStats = await prisma_1.prisma.grade.aggregate({
            _avg: { score: true }
        });
        // 4. Academic Year
        const activeAcademicYear = await prisma_1.prisma.academicYear.findFirst({
            where: { isActive: true }
        });
        // 5. Recent Announcements
        const recentAnnouncements = await prisma_1.prisma.announcement.findMany({
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
    }
    catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).json({ success: false, message: "Gagal mengambil data dashboard" });
    }
};
exports.getDashboardSummary = getDashboardSummary;
//# sourceMappingURL=dashboard.controller.js.map