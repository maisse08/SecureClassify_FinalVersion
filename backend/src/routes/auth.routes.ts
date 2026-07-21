import { Router } from "express";
import authController from "../controllers/auth.controller";
import { loginValidator } from "../validators/auth.validator";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.post("/login", loginValidator, authController.login);
router.post("/logout", authMiddleware, authController.logout);

export default router;