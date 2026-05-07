import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";

import authRouter from "./routes/auth.route";
import studentsRouter from "./routes/students.route";
import teachersRouter from "./routes/teachers.route";
import guardiansRouter from "./routes/guardians.route";
import academicYearsRouter from "./routes/academic-years.route";
import classesRouter from "./routes/classes.route";
import subjectsRouter from "./routes/subjects.route";
import schedulesRouter from "./routes/schedules.route";
import attendancesRouter from "./routes/attendances.route";
import gradesRouter from "./routes/grades.route";
import announcementsRouter from "./routes/announcements.route";
import usersRouter from "./routes/user.route";
import dashboardRouter from "./routes/dashboard.route";
import hubTeacherRouter from "./routes/hub-teacher.route";
import hubRouter from "./routes/hub.route";
import learningModulesRouter from "./routes/learning-modules.route";
import principalsRouter from "./routes/principals.route";
import teacherAttendancesRouter from "./routes/teacher-attendances.route";
import notificationRouter from "./routes/notification.route";

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/students", studentsRouter);
app.use("/api/teachers", teachersRouter);
app.use("/api/guardians", guardiansRouter);
app.use("/api/academic-years", academicYearsRouter);
app.use("/api/classes", classesRouter);
app.use("/api/subjects", subjectsRouter);
app.use("/api/schedules", schedulesRouter);
app.use("/api/attendances", attendancesRouter);
app.use("/api/grades", gradesRouter);
app.use("/api/announcements", announcementsRouter);
app.use("/api/principals", principalsRouter);
app.use("/api/teacher-attendances", teacherAttendancesRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/users", usersRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/hub/teacher/learning-modules", learningModulesRouter);
app.use("/api/hub/teacher", hubTeacherRouter);
app.use("/api/hub", hubRouter);

// Start
app.listen(PORT, () => {
  console.log(`🚀 Maleo API running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
});
