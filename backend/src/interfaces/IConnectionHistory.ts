import { Document, Types } from "mongoose";

export interface IConnectionHistory extends Document {
    user?: Types.ObjectId;
    userDisplayName?: string;
    email: string;
    action: "login" | "logout" | "failed_login";
    success: boolean;
    ip?: string;
    userAgent?: string;
    timestamp: Date;
}
