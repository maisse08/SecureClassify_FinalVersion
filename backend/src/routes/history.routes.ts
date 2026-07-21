import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { permissionMiddleware } from "../middlewares/permission.middleware";
import historyController from "../controllers/history.controller";
import { ROLES } from "../constants/roles";
import { PERMISSIONS } from "../constants/permissions";

const router = Router();

router.get(
    "/data/:dataId",
    authMiddleware,
    historyController.getDataHistory
);

// Viewing history/trash for everyone is normally an admin-only action, but an
// admin can delegate it to a specific user via the HISTORY_VIEW permission.
router.get(
    "/data",
    authMiddleware,
    permissionMiddleware(PERMISSIONS.HISTORY_VIEW),
    historyController.getAllDataHistory
);

router.get(
    "/connections",
    authMiddleware,
    permissionMiddleware(PERMISSIONS.HISTORY_VIEW),
    historyController.getConnectionHistory
);

router.get(
    "/connections/me",
    authMiddleware,
    historyController.getMyConnectionHistory
);

router.get(
    "/data/me",
    authMiddleware,
    historyController.getMyDataHistory
);

export default router;
