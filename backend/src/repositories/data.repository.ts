import Data from "../models/Data";
import { IData } from "../interfaces/IData";

class DataRepository {
    async create(data: Partial<IData>): Promise<IData> {
        const created = await Data.create(data);

        const populated = await Data.findById(created._id)
            .populate("categorie", "name")
            .populate("type", "name")
            .populate("departement", "name")
            .populate("proprietaire", "firstName lastName email")
            .lean();

        if (!populated) {
            throw new Error("Failed to create data");
        }

        return populated as IData;
    }

    async findAllActive(): Promise<IData[]> {
        // Records only ever leave this collection by being moved to Trash
        // (see DataService.deleteData), so anything found here is "active"
        // regardless of its workflow status (Imported / CIA Assigned / Classified).
        return (await Data.find({})
            .populate("categorie", "name")
            .populate("type", "name")
            .populate("departement", "name")
            .populate("proprietaire", "firstName lastName email")
            .lean()) as IData[];
    }

    async findByOwner(ownerId: string): Promise<IData[]> {
        return (await Data.find({
            proprietaire: ownerId,
        })
            .populate("categorie", "name")
            .populate("type", "name")
            .populate("departement", "name")
            .populate("proprietaire", "firstName lastName email")
            .lean()) as IData[];
    }

    async findByStatus(statut: string): Promise<IData[]> {
        return (await Data.find({ statut: statut as IData["statut"] })
            .populate("categorie", "name")
            .populate("type", "name")
            .populate("departement", "name")
            .populate("proprietaire", "firstName lastName email")
            .lean()) as IData[];
    }

    async findManyByIds(ids: string[]): Promise<IData[]> {
        if (ids.length === 0) return [];

        return (await Data.find({
            _id: { $in: ids },
        })
            .populate("categorie", "name")
            .populate("type", "name")
            .populate("departement", "name")
            .populate("proprietaire", "firstName lastName email")
            .lean()) as IData[];
    }

    async findById(id: string): Promise<IData | null> {
        return (await Data.findById(id)
            .populate("categorie", "name")
            .populate("type", "name")
            .populate("departement", "name")
            .populate("proprietaire", "firstName lastName email")
            .lean()) as IData | null;
    }

    async update(id: string, data: Partial<IData>): Promise<IData | null> {
        const updated = await Data.findByIdAndUpdate(id, data, {
            new: true,
        });

        if (!updated) {
            return null;
        }

        return (await Data.findById(updated._id)
            .populate("categorie", "name")
            .populate("type", "name")
            .populate("departement", "name")
            .populate("proprietaire", "firstName lastName email")
            .lean()) as IData | null;
    }

    // Single-responsibility update used ONLY by the CIA Assessment step:
    // sets the raw C/I/A levels + calculation method and moves the record
    // to "CIA Assigned". Never touches niveauGlobal/statut beyond that.
    async updateCIA(
        id: string,
        ciaData: { confidentialite: number; integrite: number; disponibilite: number; methodeCalcul: "MAX" | "MOY" }
    ): Promise<IData | null> {
        const updated = await Data.findByIdAndUpdate(
            id,
            {
                niveauCIA: {
                    confidentialite: ciaData.confidentialite,
                    integrite: ciaData.integrite,
                    disponibilite: ciaData.disponibilite,
                    methodeCalcul: ciaData.methodeCalcul,
                    niveauGlobal: undefined,
                },
                statut: "CIA Assigned",
                dateModification: new Date(),
            },
            { new: true }
        );

        if (!updated) {
            return null;
        }

        return (await Data.findById(updated._id)
            .populate("categorie", "name")
            .populate("type", "name")
            .populate("departement", "name")
            .populate("proprietaire", "firstName lastName email")
            .lean()) as IData | null;
    }

    // Single-responsibility update used ONLY by the Global Classification
    // step: stores the computed niveauGlobal, classification, and
    // protectionRequired, and moves the record to "Classified". Never
    // touches the raw C/I/A levels.
    async updateClassification(id: string, niveauGlobal: number, classification: string, protectionRequired: string): Promise<IData | null> {
        const existing = await Data.findById(id).lean();
        if (!existing) {
            return null;
        }

        const updated = await Data.findByIdAndUpdate(
            id,
            {
                "niveauCIA.niveauGlobal": niveauGlobal,
                "niveauCIA.classification": classification,
                "niveauCIA.protectionRequired": protectionRequired,
                statut: "Classified",
                dateModification: new Date(),
            },
            { new: true }
        );

        if (!updated) {
            return null;
        }

        return (await Data.findById(updated._id)
            .populate("categorie", "name")
            .populate("type", "name")
            .populate("departement", "name")
            .populate("proprietaire", "firstName lastName email")
            .lean()) as IData | null;
    }

    async permanentlyDelete(id: string): Promise<IData | null> {
        return await Data.findByIdAndDelete(id);
    }

    // --- Reference-module usage statistics ---
    // Data documents only ever leave this collection via Trash, so counting
    // here always reflects "active" dataset usage.

    async countByCategory(categoryId: string): Promise<number> {
        return await Data.countDocuments({ categorie: categoryId });
    }

    async countByDataType(dataTypeId: string): Promise<number> {
        return await Data.countDocuments({ type: dataTypeId });
    }

    async countByDepartment(departmentId: string): Promise<number> {
        return await Data.countDocuments({ departement: departmentId });
    }

    async countGroupedByCategory(): Promise<Record<string, number>> {
        const rows = await Data.aggregate([
            { $match: { categorie: { $ne: null } } },
            { $group: { _id: "$categorie", count: { $sum: 1 } } },
        ]);
        return rows.reduce((acc: Record<string, number>, row: any) => {
            acc[String(row._id)] = row.count;
            return acc;
        }, {});
    }

    async countGroupedByDataType(): Promise<Record<string, number>> {
        const rows = await Data.aggregate([
            { $match: { type: { $ne: null } } },
            { $group: { _id: "$type", count: { $sum: 1 } } },
        ]);
        return rows.reduce((acc: Record<string, number>, row: any) => {
            acc[String(row._id)] = row.count;
            return acc;
        }, {});
    }

    async countGroupedByDepartment(): Promise<Record<string, number>> {
        const rows = await Data.aggregate([
            { $match: { departement: { $ne: null } } },
            { $group: { _id: "$departement", count: { $sum: 1 } } },
        ]);
        return rows.reduce((acc: Record<string, number>, row: any) => {
            acc[String(row._id)] = row.count;
            return acc;
        }, {});
    }
}

export default new DataRepository();