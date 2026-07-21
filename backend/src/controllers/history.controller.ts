import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import historyService from "../services/history.service";
import dataRepository from "../repositories/data.repository";
import userRepository from "../repositories/user.repository";
import { ROLES } from "../constants/roles";

class HistoryController {
    getDataHistory = asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as any;
        const requester = authReq.user;
        if (!requester) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const data = await dataRepository.findById(req.params.dataId as string);
        if (!data) {
            return res.status(404).json({ success: false, message: "Data not found" });
        }

        // Handle both populated (object) and non-populated (string) owner fields
        const proprietaire = data.proprietaire as any;
        const ownerId = proprietaire 
            ? (typeof proprietaire === 'object' ? proprietaire._id?.toString() : proprietaire.toString())
            : undefined;

        if (requester.role === ROLES.ADMIN || (proprietaire && ownerId === requester.id)) {
            const dataHistory = await historyService.getDataHistory(req.params.dataId as string);
            return res.status(200).json({ success: true, data: dataHistory });
        }

        const dbUser = await userRepository.findById(requester.id);
        const permissions: string[] = dbUser?.permissions || [];
        if (permissions.includes("data.view.others")) {
            const dataHistory = await historyService.getDataHistory(req.params.dataId as string);
            return res.status(200).json({ success: true, data: dataHistory });
        }

        return res.status(403).json({ success: false, message: "Forbidden" });
    });

    getAllDataHistory = asyncHandler(async (req: Request, res: Response) => {
        const dataHistory = await historyService.getAllDataHistory();
        res.status(200).json({ success: true, data: dataHistory });
    });

    getConnectionHistory = asyncHandler(async (req: Request, res: Response) => {
        const connectionHistory = await historyService.getConnectionHistory();
        res.status(200).json({ success: true, data: connectionHistory });
    });

    getMyConnectionHistory = asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as any;
        const requester = authReq.user;
        if (!requester) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const history = await historyService.getConnectionHistoryByUser(requester.id);
        res.status(200).json({ success: true, data: history });
    });

    getMyDataHistory = asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as any;
        const requester = authReq.user;
        if (!requester) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const history = await historyService.getDataHistoryByUser(requester.id);
        res.status(200).json({ success: true, data: history });
    });
}

export default new HistoryController();