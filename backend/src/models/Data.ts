import mongoose, { Schema } from "mongoose";
import { IData } from "../interfaces/IData";

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
        classification: {
            type: String,
            enum: ["Public", "Internal", "Confidential", "Highly Confidential"],
        },
        protectionRequired: {
            type: String,
            enum: ["Basic protection", "Standard protection", "Enhanced protection", "Maximum protection"],
        },
    },
    { _id: false }
);

// One entry per file included in a folder/multi-file import.
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

const dataSchema = new Schema<IData>(
    {
        titre: {
            type: String, required: true, trim: true,
        },
        description: {
            type: String, trim: true,
        },
        categorie: {
            type: Schema.Types.ObjectId, ref: "Category", required: true,
        },
        type: {
            type: Schema.Types.ObjectId, ref: "DataType", required: false,
        },
        departement: {
            type: Schema.Types.ObjectId, ref: "Department", required: false,
        },
        proprietaire: {
            type: Schema.Types.ObjectId, ref: "User", required: true,
        },
        niveauCIA: {
            type: niveauCIASchema, required: false, default: undefined,
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

        // --- Import metadata (dataset) ---
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
            default: Date.now,
        },

        statut: {
            type: String,
            enum: ["Imported", "CIA Assigned", "Classified"],
            default: "Imported",
        },
        dateCreation: {
            type: Date,
            default: Date.now,
        },
        dateModification: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: false,
    }
);

export default mongoose.model<IData>("Data", dataSchema);
