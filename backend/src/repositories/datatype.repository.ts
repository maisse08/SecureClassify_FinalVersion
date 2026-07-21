import DataType from "../models/DataType";
import { IDataType } from "../interfaces/IDataType";

class DataTypeRepository {
    async create(dataType: Partial<IDataType>): Promise<IDataType> {
        return await DataType.create(dataType);
    }

    async findById(id: string): Promise<IDataType | null> {
        return await DataType.findById(id);
    }

    async findAll(): Promise<IDataType[]> {
        return await DataType.find({}).sort({ isActive: -1, createdAt: -1 });
    }

    async findByName(name: string): Promise<IDataType | null> {
        return await DataType.findOne({ name });
    }

    async update(id: string, data: Partial<IDataType>): Promise<IDataType | null> {
        return await DataType.findByIdAndUpdate(id, data, { new: true });
    }

    async deactivate(id: string): Promise<IDataType | null> {
        return await DataType.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        );
    }

    async findAllInactive(): Promise<IDataType[]> {
        return await DataType.find({ isActive: false }).sort({ createdAt: -1 });
    }

    async restore(id: string): Promise<IDataType | null> {
        return await DataType.findByIdAndUpdate(
            id,
            { isActive: true },
            { new: true }
        );
    }

    async permanentlyDelete(id: string): Promise<IDataType | null> {
        return await DataType.findByIdAndDelete(id);
    }
}

export default new DataTypeRepository();