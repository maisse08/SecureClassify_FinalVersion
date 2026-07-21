import { Document, Types } from "mongoose";

export interface INiveauCIA {
    confidentialite?: number;
    integrite?: number;
    disponibilite?: number;
    methodeCalcul?: "MAX" | "MOY";
    niveauGlobal?: number;
    classification?: "Public" | "Internal" | "Confidential" | "Highly Confidential";
    protectionRequired?: "Basic protection" | "Standard protection" | "Enhanced protection" | "Maximum protection";
}

// One entry per file that was part of a folder/multi-file import.
export interface IImportedFile {
    filename: string;
    originalName: string;
    size: number;
    extension: string;
    mimeType?: string;
}

export type DataStatus = "Imported" | "CIA Assigned" | "Classified";

export interface IData extends Document {
    titre: string;
    description?: string;
    categorie: Types.ObjectId;
    // Kept for backward compatibility with the previous manual-entry workflow.
    // No longer collected from the user during import; optional going forward.
    type?: Types.ObjectId;
    departement?: Types.ObjectId;
    proprietaire: Types.ObjectId;
    niveauCIA?: INiveauCIA;
    // Legacy single-attachment field (still used by update/share flows).
    pieceJointe?: string;
    tailleAttachement?: number;
    dataLengthBytes?: number;
    dataLengthChars?: number;

    // --- Import metadata (dataset) ---
    importedFiles: IImportedFile[];
    fileCount: number;
    totalSize: number;
    fileTypes: string[];
    importDate: Date;

    statut: DataStatus;
    dateCreation: Date;
    dateModification: Date;
}
