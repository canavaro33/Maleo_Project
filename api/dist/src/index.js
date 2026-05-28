"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const auth_route_1 = __importDefault(require("./routes/auth.route"));
const students_route_1 = __importDefault(require("./routes/students.route"));
const teachers_route_1 = __importDefault(require("./routes/teachers.route"));
const guardians_route_1 = __importDefault(require("./routes/guardians.route"));
const academic_years_route_1 = __importDefault(require("./routes/academic-years.route"));
const classes_route_1 = __importDefault(require("./routes/classes.route"));
const subjects_route_1 = __importDefault(require("./routes/subjects.route"));
const schedules_route_1 = __importDefault(require("./routes/schedules.route"));
const attendances_route_1 = __importDefault(require("./routes/attendances.route"));
const grades_route_1 = __importDefault(require("./routes/grades.route"));
const announcements_route_1 = __importDefault(require("./routes/announcements.route"));
const user_route_1 = __importDefault(require("./routes/user.route"));
const dashboard_route_1 = __importDefault(require("./routes/dashboard.route"));
const hub_teacher_route_1 = __importDefault(require("./routes/hub-teacher.route"));
const hub_route_1 = __importDefault(require("./routes/hub.route"));
const grade_config_route_1 = __importDefault(require("./routes/grade-config.route"));
const learning_modules_route_1 = __importDefault(require("./routes/learning-modules.route"));
const principals_route_1 = __importDefault(require("./routes/principals.route"));
const principal_route_1 = __importDefault(require("./routes/principal.route"));
const teacher_attendances_route_1 = __importDefault(require("./routes/teacher-attendances.route"));
const notification_route_1 = __importDefault(require("./routes/notification.route"));
const lms_route_1 = __importDefault(require("./routes/lms.route"));
const profile_route_1 = __importDefault(require("./routes/profile.route"));
const connect_route_1 = __importDefault(require("./routes/connect.route"));
const rps_route_1 = __importDefault(require("./routes/rps.route"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
// Middleware
app.use((0, cors_1.default)({ origin: process.env.CLIENT_URL || "http://localhost:3000", credentials: true }));
app.use(express_1.default.json());
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "../uploads")));
// Health check
app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});
// Routes
app.use("/api/auth", auth_route_1.default);
app.use("/api/students", students_route_1.default);
app.use("/api/teachers", teachers_route_1.default);
app.use("/api/guardians", guardians_route_1.default);
app.use("/api/academic-years", academic_years_route_1.default);
app.use("/api/classes", classes_route_1.default);
app.use("/api/subjects", subjects_route_1.default);
app.use("/api/schedules", schedules_route_1.default);
app.use("/api/attendances", attendances_route_1.default);
app.use("/api/grades", grades_route_1.default);
app.use("/api/announcements", announcements_route_1.default);
app.use("/api/principals", principals_route_1.default);
app.use("/api/principal", principal_route_1.default);
app.use("/api/teacher-attendances", teacher_attendances_route_1.default);
app.use("/api/notifications", notification_route_1.default);
app.use("/api/users", user_route_1.default);
app.use("/api/dashboard", dashboard_route_1.default);
app.use("/api/hub/teacher/learning-modules", learning_modules_route_1.default);
app.use("/api/hub/teacher", hub_teacher_route_1.default);
app.use("/api/grade-config", grade_config_route_1.default);
app.use("/api/hub", hub_route_1.default);
app.use("/api/lms", lms_route_1.default);
app.use("/api/rps", rps_route_1.default);
app.use("/api/profile", profile_route_1.default);
app.use("/api/connect", connect_route_1.default);
// Error Handler
app.use((err, req, res, next) => {
    console.error(err);
    if (err instanceof Error && err.message.includes("File type not supported")) {
        return res.status(400).json({ success: false, message: err.message });
    }
    if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ success: false, message: "Ukuran file terlalu besar. Maksimal 20MB." });
    }
    res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada server.",
        error: process.env.NODE_ENV === "development" ? err.message : undefined
    });
});
// Start
app.listen(PORT, () => {
    console.log(`🚀 Maleo API running on http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
});
//# sourceMappingURL=index.js.map