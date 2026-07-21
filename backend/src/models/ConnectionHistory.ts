import mongoose, { Schema } from "mongoose";
import { IConnectionHistory } from "../interfaces/IConnectionHistory";

const connectionHistorySchema = new Schema<IConnectionHistory>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        userDisplayName: {
            type: String,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        action: {
            type: String,
            enum: ["login", "logout", "failed_login"],
            required: true,
        },
        success: {
            type: Boolean,
            required: true,
        },
        ip: {
            type: String,
        },
        userAgent: {
            type: String,
        },
    },
    {
        timestamps: { createdAt: "timestamp", updatedAt: false },
    }
);

export default mongoose.model<IConnectionHistory>("ConnectionHistory", connectionHistorySchema);
