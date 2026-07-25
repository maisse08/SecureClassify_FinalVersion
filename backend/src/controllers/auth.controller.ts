import { Request, Response } from "express";
import authService from "../services/auth.service";
import mfaService from "../services/mfa.service";
import asyncHandler from "../utils/asyncHandler";
import historyService from "../services/history.service";
import userRepository from "../repositories/user.repository";
import AppError from "../exceptions/AppError";

class AuthController {

    login = asyncHandler(async (req: Request, res: Response) => {
        try {
            const result = await authService.login(req.body);

            await historyService.logConnection({
                user: (result as any).user?.id,
                userDisplayName: (result as any).user?.displayName,
                email: req.body.email,
                action: "login",
                success: true,
                ip: req.ip,
                userAgent: req.headers["user-agent"] as string,
            });

            res.status(200).json({
                success: true,
                message: result.message,
                data: result,
            });
        } catch (error: any) {
            await historyService.logConnection({
                email: req.body.email || "unknown",
                action: "failed_login",
                success: false,
                ip: req.ip,
                userAgent: req.headers["user-agent"] as string,
            });
            throw error;
        }
    });

    verifyMfa = asyncHandler(async (req: Request, res: Response) => {
        try {
            const { email, otp } = req.body;

            // Find user by email
            const user = await userRepository.findByEmail(email);
            if (!user) {
                throw new AppError("Invalid email or OTP", 401);
            }

            // Verify MFA code
            const isValid = await mfaService.verifyMfaCode(user._id.toString(), otp);

            if (!isValid) {
                await historyService.logConnection({
                    user: user._id,
                    userDisplayName: user.displayName,
                    email: user.email,
                    action: "mfa_verification_failed",
                    success: false,
                    ip: req.ip,
                    userAgent: req.headers["user-agent"] as string,
                });

                return res.status(401).json({
                    success: false,
                    message: "Invalid verification code",
                });
            }

            // MFA successful - generate JWT using existing logic
            const result = await authService.completeMfaLogin(user._id.toString());

            // Log successful MFA verification (don't break auth if logging fails)
            try {
                await historyService.logConnection({
                    user: result.user.id,
                    userDisplayName: result.user.displayName,
                    email: user.email,
                    action: "mfa_verification_successful",
                    success: true,
                    ip: req.ip,
                    userAgent: req.headers["user-agent"] as string,
                });
            } catch (historyError) {
                // Log the error but don't break the authentication flow
                console.error("Failed to log connection history:", historyError);
            }

            res.status(200).json({
                success: true,
                message: "MFA verification successful",
                data: result,
            });
        } catch (error: any) {
            // Log failed MFA attempt
            if (error.message.includes("Too many failed attempts")) {
                await historyService.logConnection({
                    email: req.body.email || "unknown",
                    action: "mfa_verification_failed",
                    success: false,
                    ip: req.ip,
                    userAgent: req.headers["user-agent"] as string,
                });
            }
            throw error;
        }
    });

    resendMfa = asyncHandler(async (req: Request, res: Response) => {
        try {
            const { email } = req.body;

            // Find user by email
            const user = await userRepository.findByEmail(email);
            if (!user) {
                throw new AppError("Invalid email", 404);
            }

            // Resend MFA code
            await mfaService.resendMfaCode(
                user._id.toString(),
                user.email,
                req.headers["user-agent"] as string,
                req.ip
            );

            await historyService.logConnection({
                user: user._id,
                userDisplayName: user.displayName,
                email: user.email,
                action: "mfa_code_resent",
                success: true,
                ip: req.ip,
                userAgent: req.headers["user-agent"] as string,
            });

            res.status(200).json({
                success: true,
                message: "A new verification code has been sent to your email.",
            });
        } catch (error: any) {
            await historyService.logConnection({
                email: req.body.email || "unknown",
                action: "mfa_resend_failed",
                success: false,
                ip: req.ip,
                userAgent: req.headers["user-agent"] as string,
            });
            throw error;
        }
    });

    logout = asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as any;

        // Fetch user email from database since JWT doesn't include it
        let userEmail = "";
        if (authReq.user?.id) {
            const user = await userRepository.findById(authReq.user.id);
            userEmail = user?.email || "";
        }

        await historyService.logConnection({
            user: authReq.user?.id,
            userDisplayName: authReq.user?.displayName,
            email: userEmail,
            action: "logout",
            success: true,
            ip: req.ip,
            userAgent: req.headers["user-agent"] as string,
        });

        res.status(200).json({
            success: true,
            message: "Logout successful",
        });
    });

}

export default new AuthController();