import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import userRepository from "../repositories/user.repository";
import { IUser } from "../interfaces/IUser";
import { ROLES } from "../constants/roles";
import { env } from "../config/env";
import User from "../models/User";
import AppError from "../exceptions/AppError";
import mfaService from "./mfa.service";

class AuthService {

    async login(data: Partial<IUser>) {

        // Password is hidden by default (select:false),
        // so we explicitly request it here.
        const user =
    await User.findOne({
        email: data.email
    }).select("+password");

if (!user) {

    throw new AppError(
        "Invalid email or password",
        401
    );

}

if (!user.isActive) {

    throw new AppError(
        "This account has been deactivated",
        403
    );

}

        const isPasswordValid =
            await bcrypt.compare(
                data.password!,
                user.password
            );

        if (!isPasswordValid) {

            throw new AppError(
                "Invalid email or password",
                401
            );

        }

        // Generate and send MFA code
        await mfaService.generateAndSendMfaCode(
            user._id.toString(),
            user.email,
            undefined,
            undefined
        );

        // Return MFA required response
        return {
            requiresMFA: true,
            message: "A verification code has been sent to your email."
        };

    }

    /**
     * Complete login after MFA verification.
     * Generates JWT token.
     *
     * @param userId - The user's ID
     * @returns Object containing user data and JWT token
     */
    async completeMfaLogin(userId: string) {
        const user = await userRepository.findById(userId);

        if (!user) {
            throw new AppError("User not found", 404);
        }

        if (!user.isActive) {
            throw new AppError("This account has been deactivated", 403);
        }

        const token =
            jwt.sign(
                {
                    id: user._id,
                    role: user.role
                },
                env.JWT_SECRET,
                {
                   expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]
                }
            );

        return {

            user: {

                id: user._id,

                firstName: user.firstName,

                lastName: user.lastName,

                displayName: user.displayName ?? `${user.firstName} ${user.lastName}`,

                email: user.email,

                role: user.role,

                department: user.department,

                isActive: user.isActive,

                permissions: user.permissions || []

            },

            token

        };

    }

}

export default new AuthService();