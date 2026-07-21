import { Document, Types } from "mongoose";
import { INiveauCIA, IImportedFile, DataStatus } from "./IData";

export interface ITrash extends Document {
    originalDataId: Types.ObjectId;
    titre: string;
    description?: string;
    categorie: Types.ObjectId;
    type?: Types.ObjectId;
    departement?: Types.ObjectId;
    proprietaire: Types.ObjectId;
    niveauCIA?: INiveauCIA;
    pieceJointe?: string;
    tailleAttachement?: number;
    dataLengthBytes?: number;
    dataLengthChars?: number;
    importedFiles?: IImportedFile[];
    fileCount?: number;
    totalSize?: number;
    fileTypes?: string[];
    importDate?: Date;
    statut?: DataStatus;
    dateCreation: Date;
    dateModification: Date;
    deletedBy: Types.ObjectId;
    deletedAt: Date;
}