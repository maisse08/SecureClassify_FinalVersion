import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import trashRepository from "../repositories/trash.repository";
import userRepository from "../repositories/user.repository";
import dataService from "../services/data.service";
import { ROLES } from "../constants/roles";
import { PERMISSIONS } from "../constants/permissions";
import AppError from "../exceptions/AppError";

class TrashController {
    getAllTrash = asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as any;
        const requester = authReq.user;

        if (!requester) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const isAdmin = requester.role === ROLES.ADMIN;
        let canManageAll = isAdmin;

        if (!canManageAll) {
            const dbUser = await userRepository.findById(requester.id);
            const permissions: string[] = dbUser?.permissions || [];
            canManageAll = permissions.includes(PERMISSIONS.HISTORY_VIEW) ||
                permissions.includes(PERMISSIONS.HISTORY_RESTORE);
        }

        const trash = canManageAll
            ? await trashRepository.findAll()
            : await trashRepository.findByOwner(requester.id);

        res.status(200).json({ success: true, data: trash });
    });

    permanentlyDeleteTrash = asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as any;
        const requester = authReq.user;

        if (!requester) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const trashEntry = await trashRepository.findById(req.params.id as string);
        if (!trashEntry) {
            throw new AppError("Trash entry not found", 404);
        }

        // Authorization: Admin can delete any trash, employees can only delete
        // their own, unless they were delegated the HISTORY_RESTORE
        // ("manage history/trash") permission by an admin.
        if (requester.role !== ROLES.ADMIN) {
            const ownerId = trashEntry.proprietaire?.toString();
            if (ownerId !== requester.id) {
                const dbUser = await userRepository.findById(requester.id);
                const permissions: string[] = dbUser?.permissions || [];
                if (!permissions.includes(PERMISSIONS.HISTORY_RESTORE)) {
                    throw new AppError("Forbidden: you can only delete your own trash", 403);
                }
            }
        }

        const result = await dataService.permanentlyDeleteFromTrash(req.params.id as string);

        res.status(200).json({ success: true, message: result.message });
    });
}

export default new TrashController();
