import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { permissionMiddleware, anyPermissionMiddleware } from "../middlewares/permission.middleware";
import { validationMiddleware } from "../middlewares/validation.middleware";
import datatypeController from "../controllers/datatype.controller";
import { PERMISSIONS } from "../constants/permissions";
import { body } from "express-validator";

const router = Router();

const createDataTypeValidator = [
    body("name").notEmpty().withMessage("Name is required"),
    body("description").optional().isString(),
];

const updateDataTypeValidator = [
    body("name").optional().notEmpty().withMessage("Name cannot be empty"),
    body("description").optional().isString(),
];

router.get(
    "/",
    authMiddleware,
    datatypeController.getAllDataTypes
);

router.get(
    "/archived",
    authMiddleware,
    anyPermissionMiddleware(PERMISSIONS.DATATYPES_ARCHIVE, PERMISSIONS.DATATYPES_RESTORE, PERMISSIONS.DATATYPES_DELETE),
    datatypeController.getArchivedDataTypes
);

router.get(
    "/:id",
    authMiddleware,
    datatypeController.getDataType
);

// Regular employees can be delegated datatypes.create / datatypes.update
// by an admin and manage this reference data without being ADMIN themselves.
router.post(
    "/",
    authMiddleware,
    permissionMiddleware(PERMISSIONS.DATATYPES_CREATE),
    createDataTypeValidator,
    validationMiddleware,
    datatypeController.createDataType
);

router.put(
    "/:id",
    authMiddleware,
    permissionMiddleware(PERMISSIONS.DATATYPES_UPDATE),
    updateDataTypeValidator,
    validationMiddleware,
    datatypeController.updateDataType
);

// Deactivate (instead of archive)
router.patch(
    "/:id/deactivate",
    authMiddleware,
    permissionMiddleware(PERMISSIONS.DATATYPES_ARCHIVE),
    datatypeController.deactivateDatatype
);

// Activate (instead of restore)
router.patch(
    "/:id/activate",
    authMiddleware,
    permissionMiddleware(PERMISSIONS.DATATYPES_RESTORE),
    datatypeController.activateDatatype
);

router.delete(
    "/:id/permanent",
    authMiddleware,
    permissionMiddleware(PERMISSIONS.DATATYPES_DELETE),
    datatypeController.permanentlyDeleteDataType
);

export default router;
