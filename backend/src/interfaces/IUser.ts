import { Document } from "mongoose";
import { Role } from "../constants/roles";
import mongoose from "mongoose";

export interface IUser extends Document {
    firstName: string;

    lastName: string;

    displayName?: string;

    email: string;

    password: string;

    role: Role;

    department?: mongoose.Types.ObjectId;

    permissions?: string[];

    isActive: boolean;

    createdAt: Date;

    updatedAt: Date;
}