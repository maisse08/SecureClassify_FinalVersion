import { Request, Response } from "express";
import authService from "../services/auth.service";
import asyncHandler from "../utils/asyncHandler";
import historyService from "../services/history.service";
import userRepository from "../repositories/user.repository";

class AuthController {

    login = asyncHandler(async (req: Request, res: Response) => {
        try {
            const result = await authService.login(req.body);

            await historyService.logConnection({
                user: result.user.id,
                userDisplayName: result.user.displayName,
                email: req.body.email,
                action: "login",
                success: true,
                ip: req.ip,
                userAgent: req.headers["user-agent"] as string,
            });

            res.status(200).json({
                success: true,
                message: "Login successful",
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