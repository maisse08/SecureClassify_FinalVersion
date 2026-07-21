import mongoose, { Schema } from "mongoose";
import { IUser } from "../interfaces/IUser";
import { ROLES } from "../constants/roles";

const userSchema = new Schema<IUser>(
    {
        firstName: {
            type: String,
            required: true,
            trim: true,
        },

        lastName: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
            select: false,
        },

        role: {
            type: String,
            enum: Object.values(ROLES),
            default: ROLES.EMPLOYEE,
        },

        displayName: {
            type: String,
            trim: true,
        },

        department: {
            type: Schema.Types.ObjectId,
            ref: "Department",
            required: function () {
        return this.role !== ROLES.ADMIN;},
        },

        permissions: {
            type: [String],
            default: [],
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

export default mongoose.model<IUser>("User", userSchema);