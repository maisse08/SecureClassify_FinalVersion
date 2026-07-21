import Trash from "../models/Trash";
import { ITrash } from "../interfaces/ITrash";

class TrashRepository {
    async create(entry: Partial<ITrash>): Promise<ITrash> {
        return await Trash.create(entry);
    }

    async findById(id: string): Promise<ITrash | null> {
        return await Trash.findById(id);
    }

    async findByOriginalDataId(originalDataId: string): Promise<ITrash | null> {
        return await Trash.findOne({ originalDataId });
    }

    async findAll(): Promise<ITrash[]> {
        return await Trash.find().sort({ deletedAt: -1 });
    }

    async findByOwner(ownerId: string): Promise<ITrash[]> {
        return await Trash.find({ proprietaire: ownerId }).sort({ deletedAt: -1 });
    }

    async deletePermanently(id: string): Promise<ITrash | null> {
        return await Trash.findByIdAndDelete(id);
    }

    async deleteByOriginalDataId(originalDataId: string): Promise<ITrash | null> {
        return await Trash.findOneAndDelete({ originalDataId });
    }

    async countAll(): Promise<number> {
        return await Trash.countDocuments();
    }

    async countByOwner(ownerId: string): Promise<number> {
        return await Trash.countDocuments({ proprietaire: ownerId });
    }
}

export default new TrashRepository();