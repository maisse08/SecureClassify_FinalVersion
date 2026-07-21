import mongoose, { Schema } from "mongoose";
import { ITrash } from "../interfaces/ITrash";

const niveauCIASchema = new Schema(
    {
        confidentialite: {
            type: Number,
            min: 1,
            max: 5,
        },
        integrite: {
            type: Number,
            min: 1,
            max: 5,
        },
        disponibilite: {
            type: Number,
            min: 1,
            max: 5,
        },
        methodeCalcul: {
            type: String,
            enum: ["MAX", "MOY"],
            default: "MAX",
        },
        niveauGlobal: {
            type: Number,
        },
    },
    { _id: false }
);

const importedFileSchema = new Schema(
    {
        filename: { type: String, required: true },
        originalName: { type: String, required: true },
        size: { type: Number, required: true },
        extension: { type: String, required: true },
        mimeType: { type: String },
    },
    { _id: false }
);

const trashSchema = new Schema<ITrash>(
    {
        originalDataId: {
            type: Schema.Types.ObjectId,
            ref: "Data",
            required: true,
        },
        titre: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        categorie: {
            type: Schema.Types.ObjectId,
            ref: "Category",
            required: true,
        },
        type: {
            type: Schema.Types.ObjectId,
            ref: "DataType",
            required: false,
        },
        departement: {
            type: Schema.Types.ObjectId,
            ref: "Department",
            required: false,
        },
        proprietaire: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        niveauCIA: {
            type: niveauCIASchema,
            required: false,
            default: undefined,
        },
        pieceJointe: {
            type: String,
            default: null,
        },
        tailleAttachement: {
            type: Number,
            default: null,
        },
        dataLengthBytes: {
            type: Number,
            default: null,
        },
        dataLengthChars: {
            type: Number,
            default: null,
        },
        importedFiles: {
            type: [importedFileSchema],
            default: [],
        },
        fileCount: {
            type: Number,
            default: 0,
        },
        totalSize: {
            type: Number,
            default: 0,
        },
        fileTypes: {
            type: [String],
            default: [],
        },
        importDate: {
            type: Date,
        },
        statut: {
            type: String,
            enum: ["Imported", "CIA Assigned", "Classified"],
        },
        dateCreation: {
            type: Date,
            required: true,
        },
        dateModification: {
            type: Date,
            required: true,
        },
        deletedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        deletedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: false,
    }
);

export default mongoose.model<ITrash>("Trash", trashSchema);