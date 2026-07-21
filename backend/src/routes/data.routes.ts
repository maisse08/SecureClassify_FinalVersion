import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { permissionMiddleware } from "../middlewares/permission.middleware";
import { uploadAttachment, uploadImportFiles } from "../middlewares/upload.middleware";
import dataController from "../controllers/data.controller";

const router = Router();

router.get(
    "/",
    authMiddleware,
    dataController.getAllData
);

router.get(
    "/me",
    authMiddleware,
    dataController.getMyData
);

router.get(
    "/:id",
    authMiddleware,
    dataController.getData
);

// Import a dataset: a folder or multiple files, plus dataset name + category.
router.post(
    "/",
    authMiddleware,
    uploadImportFiles,
    dataController.importData
);

router.put(
    "/:id",
    authMiddleware,
    uploadAttachment,
    dataController.updateData
);

// CIA Assessment page: assign ONE CIA rating to the whole dataset.
router.patch(
    "/:id/cia",
    authMiddleware,
    dataController.assignCIA
);

// Separate action: calculate the global classification from the assigned CIA.
router.post(
    "/:id/calculate-classification",
    authMiddleware,
    dataController.calculateClassification
);

router.delete(
    "/:id",
    authMiddleware,
    dataController.deleteData
);

export default router;
