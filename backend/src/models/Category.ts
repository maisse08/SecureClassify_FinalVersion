import mongoose, { Schema } from "mongoose";
import { ICategory } from "../interfaces/ICategory";

const categorySchema = new Schema<ICategory>(
    {

        name: {

            type: String,

            required: true,

            unique: true,

            trim: true

        },

        description: {

            type: String,

            default: ""

        },

        color: {

            type: String,

            required: true,

            default: "#1976D2"

        },

        isActive: {

            type: Boolean,

            default: true

        }

    },
    {

        timestamps: true

    }
);

export default mongoose.model<ICategory>(
    "Category",
    categorySchema
);