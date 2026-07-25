import crypto from "crypto";
import bcrypt from "bcrypt";
import PasswordReset from "../models/PasswordReset";
import userRepository from "../repositories/user.repository";
import emailService from "./email.service";
import AppError from "../exceptions/AppError";

class PasswordResetService {
    /**
     * Request a password reset.
     * Always returns the same generic success response for security,
     * regardless of whether the email exists.
     * Sends a real email via SMTP if configured.
     */
    async requestReset(email: string) {
        const user = await userRepository.findByEmail(email);

        if (user) {
            // Generate a secure random token
            const token = crypto.randomBytes(32).toString("hex");

            // Set expiration to 15 minutes from now
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

            // Store the token
            await PasswordReset.create({
                email,
                token,
                expiresAt,
            });

            // Send the reset email via SMTP
            await emailService.sendPasswordResetEmail(email, token);
        }

        // Always return the same message regardless of whether the email exists
        return {
            message: "If an account with that email exists, a password reset link has been sent.",
        };
    }

    /**
     * Reset the password using a valid token.
     */
    async resetPassword(token: string, newPassword: string) {
        // Find the token
        const resetRecord = await PasswordReset.findOne({ token });

        if (!resetRecord) {
            throw new AppError("Invalid or expired reset token", 400);
        }

        // Check if token has expired
        if (new Date() > resetRecord.expiresAt) {
            throw new AppError("Invalid or expired reset token", 400);
        }

        // Check if token has already been used
        if (resetRecord.used) {
            throw new AppError("Invalid or expired reset token", 400);
        }

        // Find the user
        const user = await userRepository.findByEmail(resetRecord.email);
        if (!user) {
            throw new AppError("Invalid or expired reset token", 400);
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password
        await userRepository.updatePassword(user._id.toString(), hashedPassword);

        // Invalidate the token (single-use)
        resetRecord.used = true;
        await resetRecord.save();

        return {
            message: "Password has been reset successfully.",
        };
    }
}

export default new PasswordResetService();