import nodemailer from "nodemailer";
import { env } from "../config/env";

class EmailService {
    private transporter: nodemailer.Transporter | null = null;

    /**
     * Initialize the transporter lazily.
     * This ensures the app doesn't crash if SMTP is not configured
     * during development/testing.
     */
    private getTransporter(): nodemailer.Transporter {
        if (!this.transporter) {
            this.transporter = nodemailer.createTransport({
                host: env.SMTP_HOST,
                port: env.SMTP_PORT,
                secure: env.SMTP_PORT === 465, // true for 465, false for others
                auth: {
                    user: env.SMTP_USER,
                    pass: env.SMTP_PASS,
                },
            });
        }
        return this.transporter;
    }

    /**
     * Check if SMTP is configured.
     */
    isConfigured(): boolean {
        return !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS && env.SMTP_FROM);
    }

    /**
     * Send a password reset email to the user.
     */
    async sendPasswordResetEmail(to: string, token: string): Promise<void> {
        if (!this.isConfigured()) {
            console.log(`[EmailService] SMTP not configured. Would send reset email to ${to} with token: ${token}`);
            return;
        }

        const resetUrl = `${env.APP_URL}/reset-password/${token}`;

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f4f4f7;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            padding: 0;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
        .header {
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            padding: 32px 40px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: 0.5px;
        }
        .header .shield {
            display: inline-block;
            margin-bottom: 12px;
        }
        .body {
            padding: 40px;
        }
        .body h2 {
            color: #1e293b;
            font-size: 20px;
            margin: 0 0 16px 0;
            font-weight: 600;
        }
        .body p {
            color: #475569;
            font-size: 15px;
            line-height: 1.7;
            margin: 0 0 16px 0;
        }
        .reset-button {
            display: inline-block;
            padding: 14px 36px;
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 600;
            margin: 24px 0;
            letter-spacing: 0.3px;
        }
        .reset-button:hover {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        }
        .divider {
            border: none;
            border-top: 1px solid #e2e8f0;
            margin: 32px 0;
        }
        .footer {
            padding: 0 40px 32px 40px;
            text-align: center;
        }
        .footer p {
            color: #94a3b8;
            font-size: 13px;
            line-height: 1.6;
            margin: 0 0 8px 0;
        }
        .footer a {
            color: #3b82f6;
            text-decoration: none;
        }
        .expiry-note {
            background-color: #fef9c3;
            border: 1px solid #fde68a;
            border-radius: 8px;
            padding: 12px 16px;
            margin: 24px 0 0 0;
            font-size: 13px;
            color: #92400e;
        }
        .expiry-note strong {
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="shield">🔒</div>
            <h1>SecureClassify</h1>
        </div>
        <div class="body">
            <h2>Password Reset Request</h2>
            <p>We received a request to reset the password for your SecureClassify account. If you made this request, click the button below to set a new password.</p>

            <div style="text-align: center;">
                <a href="${resetUrl}" class="reset-button" target="_blank">Reset Password</a>
            </div>

            <p style="margin-top: 8px;">If the button above does not work, copy and paste the following link into your browser:</p>
            <p style="font-size: 13px; color: #64748b; word-break: break-all; background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0;">${resetUrl}</p>

            <div class="expiry-note">
                <strong>⏰ This link expires in 15 minutes</strong> and can only be used once. If you did not request a password reset, please ignore this email.
            </div>
        </div>
        <hr class="divider">
        <div class="footer">
            <p>This is an automated message from SecureClassify. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} SecureClassify. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
        `;

        const transporter = this.getTransporter();

        await transporter.sendMail({
            from: env.SMTP_FROM,
            to,
            subject: "SecureClassify - Password Reset Request",
            html,
        });

        console.log(`[EmailService] Password reset email sent to ${to}`);
    }

    /**
     * Send an MFA verification code email to the user.
     */
    async sendMfaCodeEmail(
        to: string,
        otp: string,
        userAgent?: string,
        ipAddress?: string
    ): Promise<void> {
        if (!this.isConfigured()) {
            console.log(`[EmailService] SMTP not configured. Would send MFA code email to ${to} with code: ${otp}`);
            return;
        }

        const loginDateTime = new Date().toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        });

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f4f4f7;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            padding: 0;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
        .header {
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            padding: 32px 40px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: 0.5px;
        }
        .header .shield {
            display: inline-block;
            margin-bottom: 12px;
        }
        .body {
            padding: 40px;
        }
        .body h2 {
            color: #1e293b;
            font-size: 20px;
            margin: 0 0 16px 0;
            font-weight: 600;
        }
        .body p {
            color: #475569;
            font-size: 15px;
            line-height: 1.7;
            margin: 0 0 16px 0;
        }
        .otp-code {
            display: inline-block;
            padding: 20px 40px;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border: 2px dashed #3b82f6;
            border-radius: 12px;
            font-size: 32px;
            font-weight: 700;
            color: #1e293b;
            letter-spacing: 8px;
            margin: 24px 0;
            font-family: 'Courier New', monospace;
        }
        .divider {
            border: none;
            border-top: 1px solid #e2e8f0;
            margin: 32px 0;
        }
        .footer {
            padding: 0 40px 32px 40px;
            text-align: center;
        }
        .footer p {
            color: #94a3b8;
            font-size: 13px;
            line-height: 1.6;
            margin: 0 0 8px 0;
        }
        .footer a {
            color: #3b82f6;
            text-decoration: none;
        }
        .expiry-note {
            background-color: #fef9c3;
            border: 1px solid #fde68a;
            border-radius: 8px;
            padding: 12px 16px;
            margin: 24px 0 0 0;
            font-size: 13px;
            color: #92400e;
        }
        .expiry-note strong {
            font-weight: 600;
        }
        .security-warning {
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 12px 16px;
            margin: 24px 0 0 0;
            font-size: 13px;
            color: #991b1b;
        }
        .security-warning strong {
            font-weight: 600;
        }
        .login-details {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            margin: 24px 0;
            font-size: 13px;
            color: #475569;
        }
        .login-details p {
            margin: 4px 0;
            font-size: 13px;
        }
        .login-details strong {
            color: #1e293b;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="shield">🔒</div>
            <h1>SecureClassify</h1>
        </div>
        <div class="body">
            <h2>Verification Code</h2>
            <p>We received a request to sign in to your SecureClassify account. Use the verification code below to complete your login.</p>

            <div style="text-align: center;">
                <div class="otp-code">${otp}</div>
            </div>

            <div class="expiry-note">
                <strong>⏰ This code expires in 5 minutes</strong> and can only be used once.
            </div>

            <div class="security-warning">
                <strong>⚠️ Security Notice:</strong> If you did not attempt to sign in, you can safely ignore this email.
            </div>

            <div class="login-details">
                <p><strong>Login Date/Time:</strong> ${loginDateTime}</p>
                ${userAgent ? `<p><strong>Browser:</strong> ${userAgent}</p>` : ''}
                ${ipAddress ? `<p><strong>IP Address:</strong> ${ipAddress}</p>` : ''}
            </div>
        </div>
        <hr class="divider">
        <div class="footer">
            <p>This is an automated message from SecureClassify. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} SecureClassify. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
        `;

        const transporter = this.getTransporter();

        await transporter.sendMail({
            from: env.SMTP_FROM,
            to,
            subject: "SecureClassify - Verification Code",
            html,
        });

        console.log(`[EmailService] MFA code email sent to ${to}`);
    }
}

export default new EmailService();
