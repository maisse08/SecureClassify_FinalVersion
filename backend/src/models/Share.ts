import mongoose, { Schema } from "mongoose";
import { IShare } from "../interfaces/IShare";

const shareSchema = new Schema<IShare>(
    {
        document: {
            type: Schema.Types.ObjectId,
            ref: "Data",
            required: true,
        },
        documentTitle: {
            type: String,
            required: true,
            trim: true,
        },
        sender: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        senderEmail: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        receiver: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        receiverEmail: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        permission: {
            type: String,
            enum: ["Read", "Read & Write", "Full Access"],
            required: true,
        },
        sharedDate: {
            type: Date,
            default: Date.now,
        },
        expirationDate: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ["Active", "Expired", "Revoked"],
            default: "Active",
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<IShare>("Share", shareSchema);