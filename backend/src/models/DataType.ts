import mongoose, { Schema } from "mongoose";
import { IDataType } from "../interfaces/IDataType";

const dataTypeSchema = new Schema<IDataType>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        description: {
            type: String,
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<IDataType>("DataType", dataTypeSchema);
