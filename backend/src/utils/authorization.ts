import userRepository from "../repositories/user.repository";
import shareService from "../services/share.service";
import { ROLES } from "../constants/roles";
import { PERMISSIONS } from "../constants/permissions";
import { IData } from "../interfaces/IData";

/**
 * Reusable authorization helper for data access.
 * Returns authorization result with debug information.
 */
export const authorizeDataAccess = async (data: IData, requester: any) => {
    const debugInfo = {
        requesterId: requester?.id,
        requesterRole: requester?.role,
        datasetOwnerId: data.proprietaire?.toString(),
        isOwner: false,
        isAdmin: false,
        activeShareFound: false,
        hasGeneralPermission: false,
        authorized: false
    };

    if (!requester) {
        console.log("[AUTH DEBUG] No requester found", debugInfo);
        return { authorized: false, debugInfo };
    }

    // Check if admin
    debugInfo.isAdmin = requester.role === ROLES.ADMIN;
    console.log("[AUTH DEBUG] Admin check:", {
        requesterId: debugInfo.requesterId,
        requesterRole: debugInfo.requesterRole,
        isAdmin: debugInfo.isAdmin
    });

    if (debugInfo.isAdmin) {
        debugInfo.authorized = true;
        console.log("[AUTH DEBUG] Authorization granted: Admin", debugInfo);
        return { authorized: true, debugInfo };
    }

    // Check if owner
    const proprietaire = data.proprietaire as any;
    const ownerId = proprietaire
        ? (typeof proprietaire === 'object' ? proprietaire._id?.toString() : proprietaire.toString())
        : undefined;

    debugInfo.isOwner = ownerId === requester.id;
    console.log("[AUTH DEBUG] Owner check:", {
        requesterId: debugInfo.requesterId,
        datasetOwnerId: debugInfo.datasetOwnerId,
        isOwner: debugInfo.isOwner
    });

    if (debugInfo.isOwner) {
        debugInfo.authorized = true;
        console.log("[AUTH DEBUG] Authorization granted: Owner", debugInfo);
        return { authorized: true, debugInfo };
    }

    // Check for active share
    const shares = await shareService.getSharesByReceiver(requester.id);
    const activeShare = shares.find(
        share => share.document.toString() === data._id.toString() &&
                share.status === "Active" &&
                share.expirationDate > new Date()
    );

    debugInfo.activeShareFound = !!activeShare;
    console.log("[AUTH DEBUG] Active share check:", {
        requesterId: debugInfo.requesterId,
        datasetId: data._id.toString(),
        activeShareFound: debugInfo.activeShareFound,
        shareDetails: activeShare ? {
            permission: activeShare.permission,
            status: activeShare.status,
            expirationDate: activeShare.expirationDate
        } : null
    });

    if (activeShare) {
        debugInfo.authorized = true;
        console.log("[AUTH DEBUG] Authorization granted: Active share", debugInfo);
        return { authorized: true, debugInfo, share: activeShare };
    }

    // Check for general permission
    const dbUser = await userRepository.findById(requester.id);
    const permissions: string[] = dbUser?.permissions || [];
    debugInfo.hasGeneralPermission = permissions.includes(PERMISSIONS.DATA_VIEW_OTHERS);

    console.log("[AUTH DEBUG] General permission check:", {
        requesterId: debugInfo.requesterId,
        hasGeneralPermission: debugInfo.hasGeneralPermission,
        permissions: permissions
    });

    if (debugInfo.hasGeneralPermission) {
        debugInfo.authorized = true;
        console.log("[AUTH DEBUG] Authorization granted: General permission", debugInfo);
        return { authorized: true, debugInfo };
    }

    console.log("[AUTH DEBUG] Authorization DENIED", debugInfo);
    return { authorized: false, debugInfo };
};

/**
 * Reusable authorization helper for dataset *management* operations
 * (delete, CIA assessment, calculate global classification).
 *
 * A requester is authorized when they are:
 *   - an administrator;
 *   - the dataset owner;
 *   - OR holds an active share with the "Full Access" permission;
 *   - OR has been delegated the "manage other users' data" permission
 *     (data.view.others).
 *
 * This mirrors the checks in `authorizeDataAccess` but tightens the
 * share requirement to "Full Access" only, so that View / Read & Write
 * collaborators cannot delete or classify someone else's data.
 */
export const authorizeDataManagement = async (data: IData, requester: any) => {
    const debugInfo = {
        requesterId: requester?.id,
        requesterRole: requester?.role,
        datasetOwnerId: data.proprietaire?.toString(),
        isOwner: false,
        isAdmin: false,
        activeFullAccessShareFound: false,
        hasGeneralPermission: false,
        authorized: false
    };

    if (!requester) {
        console.log("[AUTH DEBUG] No requester found", debugInfo);
        return { authorized: false, debugInfo };
    }

    // Check if admin
    debugInfo.isAdmin = requester.role === ROLES.ADMIN;
    console.log("[AUTH DEBUG] Management - Admin check:", {
        requesterId: debugInfo.requesterId,
        isAdmin: debugInfo.isAdmin
    });

    if (debugInfo.isAdmin) {
        debugInfo.authorized = true;
        console.log("[AUTH DEBUG] Management authorization granted: Admin", debugInfo);
        return { authorized: true, debugInfo };
    }

    // Check if owner
    const proprietaire = data.proprietaire as any;
    const ownerId = proprietaire
        ? (typeof proprietaire === 'object' ? proprietaire._id?.toString() : proprietaire.toString())
        : undefined;

    debugInfo.isOwner = ownerId === requester.id;
    console.log("[AUTH DEBUG] Management - Owner check:", {
        requesterId: debugInfo.requesterId,
        datasetOwnerId: debugInfo.datasetOwnerId,
        isOwner: debugInfo.isOwner
    });

    if (debugInfo.isOwner) {
        debugInfo.authorized = true;
        console.log("[AUTH DEBUG] Management authorization granted: Owner", debugInfo);
        return { authorized: true, debugInfo };
    }

    // Check for an active share with "Full Access" permission
    const shares = await shareService.getSharesByReceiver(requester.id);
    const fullAccessShare = shares.find(
        share => share.document.toString() === data._id.toString() &&
                share.status === "Active" &&
                share.expirationDate > new Date() &&
                share.permission === "Full Access"
    );

    debugInfo.activeFullAccessShareFound = !!fullAccessShare;
    console.log("[AUTH DEBUG] Management - Full Access share check:", {
        requesterId: debugInfo.requesterId,
        datasetId: data._id.toString(),
        activeFullAccessShareFound: debugInfo.activeFullAccessShareFound,
        shareDetails: fullAccessShare ? {
            permission: fullAccessShare.permission,
            status: fullAccessShare.status,
            expirationDate: fullAccessShare.expirationDate
        } : null
    });

    if (fullAccessShare) {
        debugInfo.authorized = true;
        console.log("[AUTH DEBUG] Management authorization granted: Full Access share", debugInfo);
        return { authorized: true, debugInfo, share: fullAccessShare };
    }

    // Check for general permission (delegate)
    const dbUser = await userRepository.findById(requester.id);
    const permissions: string[] = dbUser?.permissions || [];
    debugInfo.hasGeneralPermission = permissions.includes(PERMISSIONS.DATA_VIEW_OTHERS);

    console.log("[AUTH DEBUG] Management - General permission check:", {
        requesterId: debugInfo.requesterId,
        hasGeneralPermission: debugInfo.hasGeneralPermission,
        permissions: permissions
    });

    if (debugInfo.hasGeneralPermission) {
        debugInfo.authorized = true;
        console.log("[AUTH DEBUG] Management authorization granted: General permission", debugInfo);
        return { authorized: true, debugInfo };
    }

    console.log("[AUTH DEBUG] Management authorization DENIED", debugInfo);
    return { authorized: false, debugInfo };
};
