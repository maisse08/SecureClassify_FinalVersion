import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import dashboardController from "../controllers/dashboard.controller";

const router = Router();

// Admin-only global dashboard (kept for backwards compatibility)
router.get("/", authMiddleware, (req, res) => {
    res.status(200).json({
        success: true,
        message: "Admin dashboard access granted",
    });
});

// Role-based dashboard: same endpoint, payload varies by role
router.get("/me", authMiddleware, dashboardController.getDashboardForMe);

export default router;

