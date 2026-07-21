import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import shareService from "../services/share.service";
import shareRepository from "../repositories/share.repository";
import dataRepository from "../repositories/data.repository";
import userRepository from "../repositories/user.repository";
import { ROLES } from "../constants/roles";
import { PERMISSIONS } from "../constants/permissions";
import AppError from "../exceptions/AppError";

class ShareController {
    createShare = asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as any;
        const requester = authReq.user;

        const { documentId, receiverEmail, permission, expirationDate } = req.body;

        // Verify document exists
        const document = await dataRepository.findById(documentId);
        if (!document) {
            throw new AppError("Document not found", 404);
        }

        // Verify the requester owns the document, is admin, or has been delegated
        // "manage other users' data" permission by an admin. Documents that were
        // themselves received via a share can NEVER be re-shared by the receiver,
        // regardless of the access level (Read / Read & Write / Full Access) they
        // were granted — sharing is reserved for the actual owner (or an admin /
        // delegate acting on the owner's behalf).
        const isOwner = document.proprietaire?.toString() === requester.id;
        const isAdmin = requester.role === ROLES.ADMIN;

        if (!isOwner && !isAdmin) {
            const dbUser = await userRepository.findById(requester.id);
            const permissions: string[] = dbUser?.permissions || [];
            const canManageOthersData = permissions.includes("data.view.others");

            if (!canManageOthersData) {
                throw new AppError("You can only share documents you own. Shared documents cannot be re-shared.", 403);
            }
        }

        // Find receiver user
        const receiver = await userRepository.findByEmail(receiverEmail);
        if (!receiver) {
            throw new AppError("Receiver user not found", 404);
        }

        // Get sender email from DB (JWT doesn't include email)
        const senderUser = await userRepository.findById(requester.id);
        const senderEmail = senderUser?.email || "";

        const share = await shareService.createShare({
            document: documentId,
            documentTitle: document.titre || "Untitled",
            sender: requester.id,
            senderEmail,
            receiver: receiver._id.toString(),
            receiverEmail,
            permission: permission || "Read",
            expirationDate: new Date(expirationDate),
        });

        res.status(201).json({
            success: true,
            message: "Document shared successfully",
            data: share,
        });
    });

    getAllShares = asyncHandler(async (req: Request, res: Response) => {
        const shares = await shareService.getAllShares();
        res.status(200).json({ success: true, data: shares });
    });

    getMyShares = asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as any;
        const requester = authReq.user;
        const shares = await shareService.getSharesForUser(requester.id);
        res.status(200).json({ success: true, data: shares });
    });

    getSharesByDocument = asyncHandler(async (req: Request, res: Response) => {
        const documentId = req.params.documentId as string;
        const shares = await shareService.getAllShares();
        const documentShares = shares.filter(
            (s: any) => s.document?.toString() === documentId
        );
        res.status(200).json({ success: true, data: documentShares });
    });

    revokeShare = asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as any;
        const requester = authReq.user;

        const existing = await shareRepository.findById(req.params.id as string);
        if (!existing) {
            throw new AppError("Share not found", 404);
        }

        // Un-sharing is reserved for the person who shared the data (or an
        // admin / delegate acting on the owner's behalf) — a recipient
        // cannot revoke a share on data they don't own.
        const isAdmin = requester.role === ROLES.ADMIN;
        const isSender = existing.sender?.toString() === requester.id;

        if (!isAdmin && !isSender) {
            const dbUser = await userRepository.findById(requester.id);
            const permissions: string[] = dbUser?.permissions || [];
            if (!permissions.includes(PERMISSIONS.DATA_VIEW_OTHERS)) {
                throw new AppError("Forbidden: you can only revoke shares of data you own", 403);
            }
        }

        const share = await shareService.revokeShare(req.params.id as string);
        res.status(200).json({
            success: true,
            message: "Share revoked successfully",
            data: share,
        });
    });

    deleteShare = asyncHandler(async (req: Request, res: Response) => {
        await shareService.deleteShare(req.params.id as string);
        res.status(200).json({
            success: true,
            message: "Share deleted successfully",
        });
    });
}

export default new ShareController();