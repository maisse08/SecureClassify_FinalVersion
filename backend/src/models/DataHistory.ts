import mongoose, { Schema } from "mongoose";
import { IDataHistory } from "../interfaces/IDataHistory";

const dataHistorySchema = new Schema<IDataHistory>(
    {
        data: {
            type: Schema.Types.ObjectId,
            ref: "Data",
            required: true,
        },
        action: {
            type: String,
            enum: ["create", "update", "delete", "restore", "import", "cia_assigned", "classified"],
            required: true,
        },
        performedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        details: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: { createdAt: "timestamp", updatedAt: false },
    }
);

export default mongoose.model<IDataHistory>("DataHistory", dataHistorySchema);
