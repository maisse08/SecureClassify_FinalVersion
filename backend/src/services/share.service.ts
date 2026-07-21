import shareRepository from "../repositories/share.repository";
import { IShare } from "../interfaces/IShare";
import AppError from "../exceptions/AppError";

class ShareService {
    async createShare(data: {
        document: string;
        documentTitle: string;
        sender: string;
        senderEmail: string;
        receiver: string;
        receiverEmail: string;
        permission: "Read" | "Read & Write" | "Full Access";
        expirationDate: Date;
    }) {
        const shareData: Partial<IShare> = {
            document: data.document as any,
            documentTitle: data.documentTitle,
            sender: data.sender as any,
            senderEmail: data.senderEmail,
            receiver: data.receiver as any,
            receiverEmail: data.receiverEmail,
            permission: data.permission,
            expirationDate: data.expirationDate,
            sharedDate: new Date(),
            status: "Active",
        };

        return await shareRepository.create(shareData);
    }

    async getAllShares() {
        return await shareRepository.findAll();
    }

    async getSharesBySender(senderId: string) {
        return await shareRepository.findBySender(senderId);
    }

    async getSharesByReceiver(receiverId: string) {
        return await shareRepository.findByReceiver(receiverId);
    }

    async getSharesForUser(userId: string) {
        const sent = await shareRepository.findBySender(userId);
        const received = await shareRepository.findByReceiver(userId);
        return { sent, received };
    }

    async revokeShare(shareId: string) {
        const share = await shareRepository.findById(shareId);
        if (!share) {
            throw new AppError("Share not found", 404);
        }
        return await shareRepository.update(shareId, { status: "Revoked" } as any);
    }

    async deleteShare(shareId: string) {
        const share = await shareRepository.findById(shareId);
        if (!share) {
            throw new AppError("Share not found", 404);
        }
        return await shareRepository.delete(shareId);
    }
}

export default new ShareService();