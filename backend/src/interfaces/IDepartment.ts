import { Document } from "mongoose";

export interface IDepartment extends Document {
    name: string;
    code: string;
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}