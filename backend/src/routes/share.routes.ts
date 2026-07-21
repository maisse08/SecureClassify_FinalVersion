import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { permissionMiddleware } from "../middlewares/permission.middleware";
import shareController from "../controllers/share.controller";
import { ROLES } from "../constants/roles";

const router = Router();

// Get all shares (admin only)
router.get(
    "/",
    authMiddleware,
    roleMiddleware(ROLES.ADMIN),
    shareController.getAllShares
);

// Get my shares (sent & received)
router.get(
    "/me",
    authMiddleware,
    shareController.getMyShares
);

// Get shares by document
router.get(
    "/document/:documentId",
    authMiddleware,
    shareController.getSharesByDocument
);

// Create a new share
router.post(
    "/",
    authMiddleware,
    permissionMiddleware("data.share"),
    shareController.createShare
);

// Revoke a share
router.put(
    "/:id/revoke",
    authMiddleware,
    shareController.revokeShare
);

// Delete a share (admin only)
router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware(ROLES.ADMIN),
    shareController.deleteShare
);

export default router;