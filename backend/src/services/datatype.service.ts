import dataTypeRepository from "../repositories/datatype.repository";
import dataRepository from "../repositories/data.repository";
import { IDataType } from "../interfaces/IDataType";
import AppError from "../exceptions/AppError";

class DataTypeService {

    async getAllDataTypes() {

        const dataTypes = await dataTypeRepository.findAll();
        const counts = await dataRepository.countGroupedByDataType();

        return dataTypes.map((dataType: any) => {
            const plain = dataType.toObject ? dataType.toObject() : dataType;
            return {
                ...plain,
                datasetCount: counts[String(dataType._id)] || 0,
            };
        });

    }

    async getArchivedDataTypes() {

        const dataTypes = await dataTypeRepository.findAllInactive();
        const counts = await dataRepository.countGroupedByDataType();

        return dataTypes.map((dataType: any) => {
            const plain = dataType.toObject ? dataType.toObject() : dataType;
            return {
                ...plain,
                datasetCount: counts[String(dataType._id)] || 0,
            };
        });

    }

    async getDataTypeById(id: string) {
        const dataType = await dataTypeRepository.findById(id);
        if (!dataType) {
            throw new AppError("Data type not found", 404);
        }
        return dataType;
    }

    async createDataType(dataType: Partial<IDataType>) {
        const existing = await dataTypeRepository.findByName(dataType.name!);
        if (existing) {
            throw new AppError("Data type name already exists", 400);
        }
        return await dataTypeRepository.create(dataType);
    }

    async updateDataType(id: string, data: Partial<IDataType>) {
        const existing = await dataTypeRepository.findById(id);
        if (!existing) {
            throw new AppError("Data type not found", 404);
        }
        return await dataTypeRepository.update(id, data);
    }

    async deactivateDataType(id: string) {
        const existing = await dataTypeRepository.findById(id);
        if (!existing) {
            throw new AppError("Data type not found", 404);
        }
        return await dataTypeRepository.deactivate(id);
    }

    async activateDataType(id: string) {
        const existing = await dataTypeRepository.findById(id);
        if (!existing) {
            throw new AppError("Data type not found", 404);
        }
        return await dataTypeRepository.restore(id);
    }

    async permanentlyDeleteDataType(id: string) {
        const existing = await dataTypeRepository.findById(id);
        if (!existing) {
            throw new AppError("Data type not found", 404);
        }

        if (existing.isActive) {
            throw new AppError(
                "Only archived data types can be permanently deleted. Archive it first.",
                400
            );
        }

        const usageCount = await dataRepository.countByDataType(id);

        if (usageCount > 0) {
            throw new AppError(
                "Cannot permanently delete this data type: it is still referenced by " +
                usageCount + " dataset(s).",
                400
            );
        }

        return await dataTypeRepository.permanentlyDelete(id);
    }

}

export default new DataTypeService();
