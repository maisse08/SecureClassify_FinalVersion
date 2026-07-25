import dotenv from "dotenv";

dotenv.config();

export const env = {
    PORT: Number(process.env.PORT) || 5000,

    MONGODB_URI:
        process.env.MONGODB_URI ||
        "mongodb://127.0.0.1:27017/secureclassify",

    JWT_SECRET:
        process.env.JWT_SECRET ||
        "YourSuperSecretKey",

    JWT_EXPIRES_IN:
        process.env.JWT_EXPIRES_IN || "1d",

    // SMTP configuration for sending emails
    SMTP_HOST: process.env.SMTP_HOST || "",
    SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
    SMTP_USER: process.env.SMTP_USER || "",
    SMTP_PASS: process.env.SMTP_PASS || "",
    SMTP_FROM: process.env.SMTP_FROM || "",

    // Application URL for reset links
    APP_URL: process.env.APP_URL || "http://localhost:5173",

    // MFA configuration
    MFA_EXPIRATION: Number(process.env.MFA_EXPIRATION) || 5,
    MFA_MAX_ATTEMPTS: Number(process.env.MFA_MAX_ATTEMPTS) || 5,
    MFA_RESEND_COOLDOWN: Number(process.env.MFA_RESEND_COOLDOWN) || 30,
};
