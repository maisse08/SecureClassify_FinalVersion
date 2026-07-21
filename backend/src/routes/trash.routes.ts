import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import trashController from "../controllers/trash.controller";
import dataController from "../controllers/data.controller";

const router = Router();

router.get(
    "/",
    authMiddleware,
    trashController.getAllTrash
);

// Restore data from trash.
// Authorization (owner of the trashed item, admin, or a user holding the
// delegated HISTORY_RESTORE "manage trash" permission) is checked inside
// dataController.restoreData, since it depends on who owns the specific
// trash entry.
router.put(
    "/:id/restore",
    authMiddleware,
    dataController.restoreData
);

// Permanently delete trash entry
router.delete(
    "/:id",
    authMiddleware,
    trashController.permanentlyDeleteTrash
);

export default router;
