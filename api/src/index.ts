import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";

import authRouter from "./routes/auth.route";
import studentsRouter from "./routes/students.route";
import teachersRouter from "./routes/teachers.route";
import guardiansRouter from "./routes/guardians.route";
import academicYearsRouter from "./routes/academic-years.route";
import gradesRouter from "./routes/grades.route";
import subjectsRouter from "./routes/subjects.route";
import schedulesRouter from "./routes/schedules.route";
import attendancesRouter from "./routes/attendances.route";
import scoresRouter from "./routes/scores.route";
import announcementsRouter from "./routes/announcements.route";

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
app.use("/api/grades", gradesRouter);
app.use("/api/subjects", subjectsRouter);
app.use("/api/schedules", schedulesRouter);
app.use("/api/attendances", attendancesRouter);
app.use("/api/scores", scoresRouter);
app.use("/api/announcements", announcementsRouter);

// Start
app.listen(PORT, () => {
  console.log(`🚀 Maleo API running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
});
