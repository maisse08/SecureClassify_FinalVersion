import { Router } from "express";
import authRoutes from "./auth.routes";
import testRoutes from "./test.routes";
import dashboardRoutes from "./dashboard.routes";
import userRoutes from "./user.routes";
import departmentRoutes from "./department.routes";
import categoryRoutes from "./category.routes";
import datatypeRoutes from "./datatype.routes";
import dataRoutes from "./data.routes";
import historyRoutes from "./history.routes";
import trashRoutes from "./trash.routes";
import shareRoutes from "./share.routes";

const router = Router();

router.get("/", (req, res) => {
    res.json({
        success: true,
        message: "SecureClassify API Running 🚀",
    });
});

router.use("/auth", authRoutes);
router.use("/test", testRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/users", userRoutes);
router.use("/departments", departmentRoutes);
router.use("/categories", categoryRoutes);
router.use("/datatypes", datatypeRoutes);
router.use("/data", dataRoutes);
router.use("/history", historyRoutes);
router.use("/shares", shareRoutes);
router.use("/trash", trashRoutes);

export default router;
