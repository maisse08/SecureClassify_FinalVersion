export interface INiveauCIA {
    confidentialite?: number;
    integrite?: number;
    disponibilite?: number;
    methodeCalcul?: "MAX" | "MOY";
    niveauGlobal?: number;
    classification?: "Public" | "Internal" | "Confidential" | "Highly Confidential";
    protectionRequired?: "Basic protection" | "Standard protection" | "Enhanced protection" | "Maximum protection";
}

export interface IImportedFile {
    filename: string;
    originalName: string;
    size: number;
    extension: string;
    mimeType?: string;
}

export type DataStatus = "Imported" | "CIA Assigned" | "Classified";

// CIA levels 1-5 each carry a fixed business meaning.
export const CIA_LEVEL_DESCRIPTIONS: Record<number, string> = {
    1: "Public",
    2: "Internal",
    3: "Confidential",
    4: "Highly Confidential",
    5: "Critical",
};

export interface ICategory {
    _id: string;
    name: string;
}

export interface IDataType {
    _id: string;
    name: string;
}

export interface IDepartment {
    _id: string;
    name: string;
}

export interface IUser {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
}

export interface IData {
    _id: string;
    titre: string;
    description?: string;
    categorie: ICategory;
    type?: IDataType;
    departement?: IDepartment;
    proprietaire: IUser;
    niveauCIA?: INiveauCIA;
    pieceJointe?: string;
    tailleAttachement?: number;
    dataLengthBytes?: number;
    dataLengthChars?: number;

    // Import metadata (dataset)
    importedFiles?: IImportedFile[];
    fileCount?: number;
    totalSize?: number;
    fileTypes?: string[];
    importDate?: string;

    statut: DataStatus;
    dateCreation: string;
    dateModification: string;
    userPermission?: string;
    sharedBy?: IUser; // User who shared this data (if not owner)
}

export interface ITrashEntry {
    _id: string;
    originalDataId: string;
    titre: string;
    description?: string;
    categorie: string;
    type: string;
    departement: string;
    proprietaire: string;
    niveauCIA: INiveauCIA;
    pieceJointe?: string;
    tailleAttachement?: number;
    deletedBy: string;
    deletedAt: string;
    dateCreation: string;
    dateModification: string;
}
