import { Document, Types } from "mongoose";

export interface IConnectionHistory extends Document {
    user?: Types.ObjectId;
    userDisplayName?: string;
    email: string;
    action: "login" | "logout" | "failed_login" | "mfa_verification_successful" | "mfa_verification_failed" | "mfa_code_resent" | "mfa_resend_failed";
    success: boolean;
    ip?: string;
    userAgent?: string;
    timestamp: Date;
}
