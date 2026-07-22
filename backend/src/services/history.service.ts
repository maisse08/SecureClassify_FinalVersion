import dataHistoryRepository from "../repositories/dataHistory.repository";
import connectionHistoryRepository from "../repositories/connectionHistory.repository";
import { IDataHistory } from "../interfaces/IDataHistory";
import { IConnectionHistory } from "../interfaces/IConnectionHistory";
import AppError from "../exceptions/AppError";

class HistoryService {
    async logDataHistory(history: Partial<IDataHistory>) {
        return await dataHistoryRepository.create(history);
    }

    async getDataHistory(dataId: string) {
        return await dataHistoryRepository.findByDataId(dataId);
    }

    async getAllDataHistory() {
        return await dataHistoryRepository.findAll();
    }

    async logConnection(history: Partial<IConnectionHistory>) {
        return await connectionHistoryRepository.create(history);
    }

    async getConnectionHistory() {
        return await connectionHistoryRepository.findAll();
    }

    async getConnectionHistoryByUser(userId: string) {
        return await connectionHistoryRepository.findByUserId(userId);
    }

    async getDataHistoryByUser(userId: string) {
        const all = await dataHistoryRepository.findAll();
        return all.filter((h: any) => {
            if (!h.performedBy) return false;
            // performedBy is populated (object with _id) by the repository's findAll()
            const performedById =
                typeof h.performedBy === "object" && h.performedBy._id
                    ? h.performedBy._id.toString()
                    : h.performedBy.toString();
            return performedById === userId;
        });
    }
}

export default new HistoryService();