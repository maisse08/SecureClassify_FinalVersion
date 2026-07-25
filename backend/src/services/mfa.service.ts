import crypto from "crypto";
import bcrypt from "bcrypt";
import MfaCode from "../models/MfaCode";
import mfaRepository from "../repositories/mfa.repository";
import emailService from "./email.service";
import AppError from "../exceptions/AppError";
import { env } from "../config/env";

class MfaService {
    /**
     * Generate a 6-digit OTP, hash it, store it, and send it via email.
     * Deletes any existing MFA codes for the user before creating a new one.
     *
     * @param userId - The user's ID
     * @param email - The user's email address
     * @param userAgent - The user's browser/device info (optional)
     * @param ipAddress - The user's IP address (optional)
     * @returns Object containing the userId and expiration info for the login flow
     */
    async generateAndSendMfaCode(
        userId: string,
        email: string,
        userAgent?: string,
        ipAddress?: string
    ): Promise<{ userId: string; expiresAt: Date }> {
        // Delete any existing MFA codes for this user
        await mfaRepository.deleteByUser(userId);

        // Generate a secure random 6-digit OTP using crypto.randomInt()
        const otp = crypto.randomInt(100000, 999999).toString();

        // Hash the OTP using bcrypt (same approach as password hashing)
        const hashedOtp = await bcrypt.hash(otp, 10);

        // Set expiration to 5 minutes from now
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        // Store the MFA code
        await mfaRepository.create({
            user: userId as any,
            hashedOtp,
            expiresAt,
            attempts: 0,
        });

        // Send the OTP via email
        await emailService.sendMfaCodeEmail(email, otp, userAgent, ipAddress);

        // Return only the information needed by the login flow
        return {
            userId,
            expiresAt,
        };
    }

    /**
     * Verify an OTP for a user.
     * Increments the attempts counter on failure.
     *
     * @param userId - The user's ID
     * @param providedOtp - The OTP provided by the user
     * @returns true if the OTP is valid, false otherwise
     */
    async verifyMfaCode(userId: string, providedOtp: string): Promise<boolean> {
        // Find the latest MFA code for the user
        const mfaCode = await mfaRepository.findByUser(userId);

        if (!mfaCode) {
            throw new AppError("MFA code not found. Please request a new code.", 400);
        }

        // Check if the code has expired
        if (new Date() > mfaCode.expiresAt) {
            throw new AppError("MFA code has expired. Please request a new code.", 400);
        }

        // Check if max attempts exceeded (read from env)
        if (mfaCode.attempts >= env.MFA_MAX_ATTEMPTS) {
            throw new AppError("Too many failed attempts. Please request a new code.", 400);
        }

        // Verify the OTP
        const isValid = await bcrypt.compare(providedOtp, mfaCode.hashedOtp);

        if (!isValid) {
            // Increment attempts counter
            await mfaRepository.incrementAttempts(mfaCode._id);
            return false;
        }

        // OTP is valid - delete it (single-use)
        await mfaRepository.deleteByUser(userId);

        return true;
    }

    /**
     * Resend MFA code with cooldown check.
     * Deletes previous OTP and generates a new one.
     *
     * @param userId - The user's ID
     * @param email - The user's email address
     * @param userAgent - The user's browser/device info (optional)
     * @param ipAddress - The user's IP address (optional)
     * @returns Object containing the userId and expiration info
     */
    async resendMfaCode(
        userId: string,
        email: string,
        userAgent?: string,
        ipAddress?: string
    ): Promise<{ userId: string; expiresAt: Date }> {
        // Find existing MFA code to check cooldown
        const existingCode = await mfaRepository.findByUser(userId);

        if (existingCode) {
            const now = new Date();
            const lastSent = existingCode.createdAt;
            const cooldownMs = env.MFA_RESEND_COOLDOWN * 1000;
            const timeSinceLastSent = now.getTime() - lastSent.getTime();

            if (timeSinceLastSent < cooldownMs) {
                const remainingSeconds = Math.ceil((cooldownMs - timeSinceLastSent) / 1000);
                throw new AppError(
                    `Please wait ${remainingSeconds} seconds before requesting a new code.`,
                    429
                );
            }
        }

        // Delete previous OTP and generate new one
        await mfaRepository.deleteByUser(userId);

        // Generate new OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        const hashedOtp = await bcrypt.hash(otp, 10);
        const expiresAt = new Date(Date.now() + env.MFA_EXPIRATION * 60 * 1000);

        // Store the new MFA code
        await mfaRepository.create({
            user: userId as any,
            hashedOtp,
            expiresAt,
            attempts: 0,
        });

        // Send the OTP via email
        await emailService.sendMfaCodeEmail(email, otp, userAgent, ipAddress);

        return {
            userId,
            expiresAt,
        };
    }
}

export default new MfaService();
