import mongoose, { Schema } from "mongoose";
import { IDepartment } from "../interfaces/IDepartment";

const departmentSchema = new Schema<IDepartment>(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },

        description: {
            type: String,
            default: "",
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

export default mongoose.model<IDepartment>(
    "Department",
    departmentSchema
);