import DataHistory from "../models/DataHistory";
import { IDataHistory } from "../interfaces/IDataHistory";

class DataHistoryRepository {
    async create(history: Partial<IDataHistory>): Promise<IDataHistory> {
        return await DataHistory.create(history);
    }

    async findByDataId(dataId: string): Promise<IDataHistory[]> {
        return await DataHistory.find({ data: dataId })
            .populate("performedBy", "email firstName lastName")
            .populate("data", "titre")
            .sort({ timestamp: -1 });
    }

    async findAll(): Promise<IDataHistory[]> {
        return await DataHistory.find()
            .populate("performedBy", "email firstName lastName")
            .populate("data", "titre")
            .sort({ timestamp: -1 });
    }
}

export default new DataHistoryRepository();
