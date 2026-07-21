import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import dataService from "../services/data.service";
import historyService from "../services/history.service";
import userRepository from "../repositories/user.repository";
import trashRepository from "../repositories/trash.repository";
import shareService from "../services/share.service";
import { ROLES } from "../constants/roles";
import { PERMISSIONS } from "../constants/permissions";
import { IData } from "../interfaces/IData";
import AppError from "../exceptions/AppError";

class DataController {
    getAllData = asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as any;
        const requester = authReq.user;

        if (!requester) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        // Admins can see all data with full access
        if (requester.role === ROLES.ADMIN) {
            const data = await dataService.getAllData();
            return res.status(200).json({ success: true, data: data.map(item => ({
                ...item,
                userPermission: "Full Access"
            }))});
        }

        // A user who was delegated the "manage other users' data" permission
        // (data.view.others) can see and manage everyone's data, just like an admin.
        const dbUser = await userRepository.findById(requester.id);
        const permissions: string[] = dbUser?.permissions || [];
        if (permissions.includes(PERMISSIONS.DATA_VIEW_OTHERS)) {
            const data = await dataService.getAllData();
            return res.status(200).json({ success: true, data: data.map(item => ({
                ...item,
                userPermission: "Full Access"
            }))});
        }

        // Regular users can see their own data + data shared with them
        const [ownedData, shares] = await Promise.all([
            dataService.getDataByOwner(requester.id),
            shareService.getSharesByReceiver(requester.id)
        ]);

        // Get the actual data objects for shared documents
        const sharedDataIds = shares
            .filter(share => share.status === "Active" && share.expirationDate > new Date())
            .map(share => share.document.toString());
        
        const sharedData = await dataService.getDataByIds(sharedDataIds);

        // Create a map of data ID to permission level
        const permissionMap = new Map<string, string>();
        shares.forEach(share => {
            if (share.status === "Active" && share.expirationDate > new Date()) {
                permissionMap.set(share.document.toString(), share.permission);
            }
        });

        // Combine owned and shared data (avoid duplicates) and add userPermission field
        const allData: any[] = [...ownedData];
        sharedData.forEach((shared: IData) => {
            if (!allData.find(item => item._id.toString() === shared._id.toString())) {
                allData.push(shared);
            }
        });

        // Add userPermission and sharedBy to each data item
        const dataWithPermissions = allData.map(item => {
            const itemId = item._id.toString();
            const isOwner = item.proprietaire?.toString() === requester.id;
            
            // Find the share record for this item to get sender info
            const shareRecord = shares.find(share => 
                share.document.toString() === itemId && 
                share.status === "Active" && 
                share.expirationDate > new Date()
            );
            
            const result: any = {
                ...item,
                userPermission: isOwner ? "Full Access" : (permissionMap.get(itemId) || "Read")
            };
            
            // If not owner and there's an active share, add sharedBy info with sender details
            if (!isOwner && shareRecord) {
                result.sharedBy = {
                    _id: shareRecord.sender,
                    firstName: shareRecord.senderEmail ? shareRecord.senderEmail.split('@')[0] : "Admin",
                    lastName: ""
                };
            }
            
            return result;
        });

        res.status(200).json({ success: true, data: dataWithPermissions });
    });

    getData = asyncHandler(async (req: Request, res: Response) => {
        const data = await dataService.getDataById(req.params.id as string);
        const authReq = req as any;
        const requester = authReq.user;

        if (!requester) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        if (requester.role === ROLES.ADMIN) {
            return res.status(200).json({ success: true, data });
        }

        // Owner can access
        if (data.proprietaire && data.proprietaire.toString() === requester.id) {
            return res.status(200).json({ success: true, data });
        }

        // Check if data is shared with the user
        const shares = await shareService.getSharesByReceiver(requester.id);
        const activeShare = shares.find(
            share => share.document.toString() === data._id.toString() &&
                    share.status === "Active" &&
                    share.expirationDate > new Date()
        );

        if (activeShare) {
            // Add sharedBy info to the response
            const dataWithSharedBy = {
                ...data,
                sharedBy: {
                    _id: activeShare.sender,
                    firstName: activeShare.senderEmail ? activeShare.senderEmail.split('@')[0] : "Admin",
                    lastName: ""
                }
            };
            return res.status(200).json({ success: true, data: dataWithSharedBy });
        }

        // Check for general permission
        const dbUser = await userRepository.findById(requester.id);
        const permissions: string[] = dbUser?.permissions || [];
        if (permissions.includes("data.view.others")) {
            return res.status(200).json({ success: true, data });
        }

        return res.status(403).json({ success: false, message: "Forbidden" });
    });

    getMyData = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.id;
        const data = await dataService.getDataByOwner(userId);
        res.status(200).json({ success: true, data });
    });

    // Replaces manual "create": the user imports a folder or multiple files.
    // Owner is always the authenticated user unless the requester is an admin
    // who explicitly provides a `proprietaire` field to assign ownership to
    // another user. Only titre (dataset name) and categorie are manually
    // entered. CIA is never assigned here.
    importData = asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as any;
        const files = (req.files as Express.Multer.File[]) || [];

        // Admins can create data on behalf of other users by specifying proprietaire
        let ownerId = authReq.user.id;
        if (authReq.user.role === ROLES.ADMIN && req.body.proprietaire) {
            ownerId = req.body.proprietaire;
        }

        const created = await dataService.importData(
            {
                titre: req.body.titre,
                description: req.body.description,
                categorie: req.body.categorie,
                type: req.body.type || undefined,
                departement: req.body.departement || undefined,
                proprietaire: req.body.proprietaire,
            },
            files,
            ownerId
        );

        await historyService.logDataHistory({
            data: created._id,
            action: "import",
            performedBy: authReq.user.id,
            details: `Imported dataset "${created.titre}" (${created.fileCount} file(s), ${created.totalSize} bytes)`,
        });

        res.status(201).json({
            success: true,
            message: "Dataset imported successfully",
            data: created,
        });
    });

    // CIA Assessment page: assign ONE CIA rating to the whole dataset.
    assignCIA = asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as any;
        const existing = await dataService.getDataById(req.params.id as string);

        await this.assertOwnDataOnly(existing, authReq.user);

        let niveauCIA = req.body.niveauCIA ?? req.body;
        if (typeof niveauCIA === "string") {
            niveauCIA = JSON.parse(niveauCIA);
        }

        const updated = await dataService.assignCIA(req.params.id as string, niveauCIA);

        await historyService.logDataHistory({
            data: updated._id,
            action: "cia_assigned",
            performedBy: authReq.user.id,
            details: `Assigned CIA levels to "${updated.titre}"`,
        });

        res.status(200).json({
            success: true,
            message: "CIA assessment saved successfully",
            data: updated,
        });
    });

    // Separate, explicit action to compute the global classification level
    // from the already-assigned CIA levels (MAX or Average).
    calculateClassification = asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as any;
        const existing = await dataService.getDataById(req.params.id as string);

        await this.assertOwnDataOnly(existing, authReq.user);

        const updated = await dataService.calculateGlobalClassification(req.params.id as string);

        await historyService.logDataHistory({
            data: updated._id,
            action: "classified",
            performedBy: authReq.user.id,
            details: `Calculated global classification for "${updated.titre}" (${updated.niveauCIA?.niveauGlobal}/5)`,
        });

        res.status(200).json({
            success: true,
            message: "Global classification calculated successfully",
            data: updated,
        });
    });

    // CIA assessment and classification are only ever performed on a user's
    // own data (or by an admin / a delegate holding "manage other users'
    // data"). Unlike updateData, a shared "Read & Write"/"Full Access"
    // collaborator does NOT get to evaluate or classify someone else's data
    // — that stays with the actual owner.
    private assertOwnDataOnly = async (existing: IData, requester: any) => {
        const isAdmin = requester.role === ROLES.ADMIN;
        
        // proprietaire can be either a raw ObjectId or a populated user object
        const proprietaire = existing.proprietaire as any;
        const ownerId = proprietaire
            ? (typeof proprietaire === 'object' ? proprietaire._id?.toString() : proprietaire.toString())
            : undefined;
        
        const isOwner = ownerId === requester.id;

        if (isAdmin || isOwner) return;

        const dbUser = await userRepository.findById(requester.id);
        const permissions: string[] = dbUser?.permissions || [];
        if (permissions.includes(PERMISSIONS.DATA_VIEW_OTHERS)) return;

        throw new AppError("Forbidden: CIA assessment is only available for your own data", 403);
    };

    // Shared write-access check used by updateData: admin, owner, an active
    // "Read & Write"/"Full Access" share, or the delegated "manage other
    // users' data" permission.
    private assertCanWrite = async (existing: IData, requester: any) => {
        const isAdmin = requester.role === ROLES.ADMIN;
        
        // proprietaire can be either a raw ObjectId or a populated user object
        const proprietaire = existing.proprietaire as any;
        const ownerId = proprietaire
            ? (typeof proprietaire === 'object' ? proprietaire._id?.toString() : proprietaire.toString())
            : undefined;
        
        const isOwner = ownerId === requester.id;

        if (isAdmin || isOwner) return;

        const shares = await shareService.getSharesByReceiver(requester.id);
        const hasWriteAccess = shares.some(
            (share) =>
                share.document.toString() === existing._id.toString() &&
                share.status === "Active" &&
                share.expirationDate > new Date() &&
                (share.permission === "Read & Write" || share.permission === "Full Access")
        );

        if (hasWriteAccess) return;

        const dbUser = await userRepository.findById(requester.id);
        const permissions: string[] = dbUser?.permissions || [];
        if (permissions.includes(PERMISSIONS.DATA_VIEW_OTHERS)) return;

        throw new AppError("Forbidden", 403);
    };

    updateData = asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as any;
        const existing = await dataService.getDataById(req.params.id as string);

        await this.assertCanWrite(existing, authReq.user);

        // If a new attachment was uploaded, store its filename and size
        if (req.file) {
            req.body.pieceJointe = req.file.filename;
            req.body.tailleAttachement = req.file.size;
        }
        if (typeof req.body.niveauCIA === "string") {
            req.body.niveauCIA = JSON.parse(req.body.niveauCIA);
        }
        const updated = await dataService.updateData(req.params.id as string, req.body);

        await historyService.logDataHistory({
            data: updated._id,
            action: "update",
            performedBy: authReq.user.id,
            details: `Updated data ${updated.titre}`,
        });

        res.status(200).json({ success: true, message: "Data updated successfully", data: updated });
    });

    deleteData = asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as any;
        const existing = await dataService.getDataById(req.params.id as string);

        // Deleting is reserved for the actual owner (or an admin / delegate
        // acting on the owner's behalf) — a shared "Full Access" collaborator
        // can modify or share, but cannot delete data they don't own.
        await this.assertOwnDataOnly(existing, authReq.user);

        const deleted = await dataService.deleteData(req.params.id as string, authReq.user.id);

        await historyService.logDataHistory({
            data: deleted._id,
            action: "delete",
            performedBy: authReq.user.id,
            details: `Moved data ${deleted.titre} to trash`,
        });

        res.status(200).json({ success: true, message: "Data moved to trash" });
    });

    restoreData = asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as any;
        const requester = authReq.user;

        if (!requester) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        // Data is permanently deleted, so we restore from Trash using the originalDataId
        const trashEntry = await trashRepository.findByOriginalDataId(req.params.id as string);
        if (!trashEntry) {
            throw new AppError("Trash entry not found", 404);
        }

        const isAdmin = requester.role === ROLES.ADMIN;
        const isOwner = trashEntry.proprietaire?.toString() === requester.id;

        if (!isAdmin && !isOwner) {
            const dbUser = await userRepository.findById(requester.id);
            const permissions: string[] = dbUser?.permissions || [];
            if (!permissions.includes(PERMISSIONS.HISTORY_RESTORE)) {
                throw new AppError("Forbidden: you can only restore your own data", 403);
            }
        }

        const restored = await dataService.restoreData(req.params.id as string);

        await historyService.logDataHistory({
            data: restored._id,
            action: "restore",
            performedBy: authReq.user.id,
            details: `Restored data ${restored.titre}`,
        });

        res.status(200).json({ success: true, message: "Data restored successfully", data: restored });
    });
}

export default new DataController();