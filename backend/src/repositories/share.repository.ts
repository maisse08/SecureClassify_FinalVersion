import Share from "../models/Share";
import { IShare } from "../interfaces/IShare";

class ShareRepository {
    async create(data: Partial<IShare>): Promise<IShare> {
        return await Share.create(data);
    }

    async findAll(): Promise<IShare[]> {
        return await Share.find().sort({ sharedDate: -1 });
    }

    async findById(id: string): Promise<IShare | null> {
        return await Share.findById(id);
    }

    async findBySender(senderId: string): Promise<IShare[]> {
        return await Share.find({ sender: senderId }).sort({ sharedDate: -1 });
    }

    async findByReceiver(receiverId: string): Promise<IShare[]> {
        return await Share.find({ receiver: receiverId }).sort({ sharedDate: -1 });
    }

    async findByDocument(documentId: string): Promise<IShare[]> {
        return await Share.find({ document: documentId }).sort({ sharedDate: -1 });
    }

    async update(id: string, data: Partial<IShare>): Promise<IShare | null> {
        return await Share.findByIdAndUpdate(id, data, { new: true });
    }

    async delete(id: string): Promise<IShare | null> {
        return await Share.findByIdAndDelete(id);
    }
}

export default new ShareRepository();