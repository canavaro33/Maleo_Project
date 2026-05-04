import { Router } from "express";
import { getDashboardSummary } from "../controllers/dashboard.controller";
import { verifyJWT } from "../middleware/auth";
import { checkRole } from "../middleware/role";

const router = Router();

// Protected route: Admin only
router.get("/summary", verifyJWT, checkRole("super_admin", "admin"), getDashboardSummary);

export default router;
