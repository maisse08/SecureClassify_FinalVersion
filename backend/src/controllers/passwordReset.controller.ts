import { Request, Response } from "express";
import passwordResetService from "../services/passwordReset.service";
import asyncHandler from "../utils/asyncHandler";

class PasswordResetController {
    /**
     * POST /api/auth/forgot-password
     * Request a password reset link.
     */
    forgotPassword = asyncHandler(async (req: Request, res: Response) => {
        const { email } = req.body;

        const result = await passwordResetService.requestReset(email);

        res.status(200).json({
            success: true,
            message: result.message,
        });
    });

    /**
     * POST /api/auth/reset-password
     * Reset the password using a valid token.
     */
    resetPassword = asyncHandler(async (req: Request, res: Response) => {
        const { token, password } = req.body;

        const result = await passwordResetService.resetPassword(token, password);

        res.status(200).json({
            success: true,
            message: result.message,
        });
    });
}

export default new PasswordResetController();