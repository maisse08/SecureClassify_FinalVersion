import dataRepository from "../repositories/data.repository";
import trashRepository from "../repositories/trash.repository";
import { IData, IImportedFile } from "../interfaces/IData";
import { ITrash } from "../interfaces/ITrash";
import AppError from "../exceptions/AppError";
import calculateCIA from "../utils/calculateCIA";

class DataService {
    async getAllData() {
        return await dataRepository.findAllActive();
    }

    async getDataById(id: string) {
        const data = await dataRepository.findById(id);
        if (!data) {
            throw new AppError("Data not found", 404);
        }
        return data;
    }

    async getDataByOwner(ownerId: string) {
        return await dataRepository.findByOwner(ownerId);
    }

    async getDataByIds(ids: string[]): Promise<IData[]> {
        if (ids.length === 0) return [];
        return await dataRepository.findManyByIds(ids);
    }

    async getDataByStatus(statut: string) {
        return await dataRepository.findByStatus(statut);
    }

    /**
     * Imports a dataset: a folder or several individually-selected files,
     * plus the manually entered name (titre) and category. No CIA is
     * assigned at this stage - the record is simply saved with status
     * "Imported". Import metadata (file list/count/size/types/date, owner)
     * is derived automatically from the uploaded files and the requester.
     */
    async importData(data: Partial<IData>, files: Express.Multer.File[], ownerId: string) {
        const importedFiles: IImportedFile[] = (files || []).map((file) => {
            const ext = (file.originalname.split(".").pop() || "").toLowerCase();
            return {
                filename: file.filename,
                originalName: file.originalname,
                size: file.size,
                extension: ext ? `.${ext}` : "",
                mimeType: file.mimetype,
            };
        });

        const totalSize = importedFiles.reduce((sum, f) => sum + (f.size || 0), 0);
        const fileTypes = Array.from(new Set(importedFiles.map((f) => f.extension).filter(Boolean)));

        // CIA is intentionally never set here - only "titre" (dataset name)
        // and "categorie" are accepted from the manual input; anything the
        // client may have sent for niveauCIA is discarded.
        const newData = await dataRepository.create({
            titre: data.titre,
            description: data.description,
            categorie: data.categorie,
            type: data.type,
            departement: data.departement,
            proprietaire: ownerId as any,
            importedFiles,
            fileCount: importedFiles.length,
            totalSize,
            fileTypes,
            importDate: new Date(),
            statut: "Imported",
            dateCreation: new Date(),
            dateModification: new Date(),
        });

        return newData;
    }

    /**
     * Assigns ONE CIA assessment to the whole dataset (not per-file). Only
     * saves the raw C/I/A levels and calculation method; the global level
     * is intentionally left uncalculated until a separate action is taken.
     */
    async assignCIA(id: string, niveauCIA: { confidentialite: number; integrite: number; disponibilite: number; methodeCalcul: "MAX" | "MOY" }) {
        const existing = await dataRepository.findById(id);
        if (!existing) {
            throw new AppError("Data not found", 404);
        }

        const { confidentialite, integrite, disponibilite, methodeCalcul } = niveauCIA;
        if (
            [confidentialite, integrite, disponibilite].some(
                (v) => typeof v !== "number" || v < 1 || v > 5
            )
        ) {
            throw new AppError("Confidentiality, integrity, and availability must each be a level between 1 and 5", 400);
        }

        const updated = await dataRepository.updateCIA(id, {
            confidentialite,
            integrite,
            disponibilite,
            methodeCalcul: methodeCalcul || "MAX",
        });

        if (!updated) {
            throw new AppError("Data not found", 404);
        }

        return updated;
    }

    /**
     * Separate, explicit action: computes the global classification level
     * from the already-assigned CIA levels using the existing MAX/Average
     * logic. Never runs automatically during import or CIA assignment.
     */
    async calculateGlobalClassification(id: string) {
        const existing = await dataRepository.findById(id);
        if (!existing) {
            throw new AppError("Data not found", 404);
        }

        const niveauCIA = existing.niveauCIA as any;
        if (
            !niveauCIA ||
            typeof niveauCIA.confidentialite !== "number" ||
            typeof niveauCIA.integrite !== "number" ||
            typeof niveauCIA.disponibilite !== "number"
        ) 
        {    throw new AppError("CIA must be assigned before calculating the global classification", 400);}

        const cia = calculateCIA({
            confidentialite: niveauCIA.confidentialite, integrite: niveauCIA.integrite,
            disponibilite: niveauCIA.disponibilite, methodeCalcul: niveauCIA.methodeCalcul || "MAX",
        });

        const updated = await dataRepository.updateClassification(id, cia.niveauGlobal, cia.classification, cia.protectionRequired);

        if (!updated) {  throw new AppError("Data not found", 404); }

        return updated;
    }

    async updateData(id: string, data: Partial<IData>) {
        const existing = await dataRepository.findById(id);
        if (!existing) {
            throw new AppError("Data not found", 404);
        }

        // Editing metadata never recalculates the global classification level;
        // that only happens through the explicit "Calculate Global
        // Classification" action (see calculateGlobalClassification above).
        data.dateModification = new Date();

        const updated = await dataRepository.update(id, data);
        if (!updated) {
            throw new AppError("Data not found", 404);
        }

        return updated;
    }

    async deleteData(id: string, deletedBy: string) {
        const data = await dataRepository.findById(id);
        if (!data) {
            throw new AppError("Data not found", 404);
        }

        // Move to Trash collection
        await trashRepository.create({
            originalDataId: data._id,
            titre: data.titre,
            description: data.description,
            categorie: data.categorie,
            type: data.type,
            departement: data.departement,
            proprietaire: data.proprietaire,
            niveauCIA: data.niveauCIA,
            pieceJointe: data.pieceJointe,
            tailleAttachement: data.tailleAttachement,
            dataLengthBytes: data.dataLengthBytes,
            dataLengthChars: data.dataLengthChars,
            importedFiles: data.importedFiles,
            fileCount: data.fileCount,
            totalSize: data.totalSize,
            fileTypes: data.fileTypes,
            importDate: data.importDate,
            statut: data.statut,
            dateCreation: data.dateCreation,
            dateModification: data.dateModification,
            deletedBy: deletedBy as any,
            deletedAt: new Date(),
        });

        // Permanently delete from Data collection
        await dataRepository.permanentlyDelete(id);

        return data;
    }

    async restoreData(id: string) {
        // Find the trash entry by original data ID
        const trashEntry = await trashRepository.findByOriginalDataId(id);
        if (!trashEntry) {
            throw new AppError("Trash entry not found", 404);
        }

        // Re-create the data entry
        const restored = await dataRepository.create({
            titre: trashEntry.titre,
            description: trashEntry.description,
            categorie: trashEntry.categorie,
            type: trashEntry.type,
            departement: trashEntry.departement,
            proprietaire: trashEntry.proprietaire,
            niveauCIA: trashEntry.niveauCIA,
            pieceJointe: trashEntry.pieceJointe,
            tailleAttachement: trashEntry.tailleAttachement,
            dataLengthBytes: trashEntry.dataLengthBytes,
            dataLengthChars: trashEntry.dataLengthChars,
            importedFiles: trashEntry.importedFiles,
            fileCount: trashEntry.fileCount,
            totalSize: trashEntry.totalSize,
            fileTypes: trashEntry.fileTypes,
            importDate: trashEntry.importDate,
            statut: trashEntry.statut,
            dateCreation: trashEntry.dateCreation,
            dateModification: new Date(),
        });

        // Remove from Trash collection
        await trashRepository.deleteByOriginalDataId(id);

        return restored;
    }

    async permanentlyDeleteFromTrash(trashId: string) {
        const trashEntry = await trashRepository.findById(trashId);
        if (!trashEntry) {
            throw new AppError("Trash entry not found", 404);
        }

        await trashRepository.deletePermanently(trashId);

        return { message: "Data permanently deleted", deletedTitre: trashEntry.titre };
    }
}

export default new DataService();
