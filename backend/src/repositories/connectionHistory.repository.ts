import ConnectionHistory from "../models/ConnectionHistory";
import { IConnectionHistory } from "../interfaces/IConnectionHistory";

class ConnectionHistoryRepository {
    async create(history: Partial<IConnectionHistory>): Promise<IConnectionHistory> {
        return await ConnectionHistory.create(history);
    }

    async findAll(): Promise<IConnectionHistory[]> {
        return await ConnectionHistory.find().sort({ timestamp: -1 });
    }

    async findByUserId(userId: string): Promise<IConnectionHistory[]> {
        return await ConnectionHistory.find({ user: userId }).sort({ timestamp: -1 });
    }
}

export default new ConnectionHistoryRepository();