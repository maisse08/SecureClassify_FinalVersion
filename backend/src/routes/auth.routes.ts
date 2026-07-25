import { Router } from "express";
import authController from "../controllers/auth.controller";
import passwordResetController from "../controllers/passwordReset.controller";
import { loginValidator } from "../validators/auth.validator";
import { verifyMfaValidator, resendMfaValidator } from "../validators/mfa.validator";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.post("/login", loginValidator, authController.login);
router.post("/verify-mfa", verifyMfaValidator, authController.verifyMfa);
router.post("/resend-mfa", resendMfaValidator, authController.resendMfa);
router.post("/logout", authMiddleware, authController.logout);

// Password reset routes (no auth required)
router.post("/forgot-password", passwordResetController.forgotPassword);
router.post("/reset-password", passwordResetController.resetPassword);

export default router;
