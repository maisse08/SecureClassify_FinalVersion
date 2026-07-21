import { Router } from "express";
import departmentController from "../controllers/department.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { permissionMiddleware, anyPermissionMiddleware } from "../middlewares/permission.middleware";
import { validationMiddleware } from "../middlewares/validation.middleware";
import {
    createDepartmentValidator,
    updateDepartmentValidator
} from "../validators/department.validator";
import { PERMISSIONS } from "../constants/permissions";

const router = Router();

router.get(
    "/",
    authMiddleware,
    departmentController.getDepartments
);

router.get(
    "/archived",
    authMiddleware,
    anyPermissionMiddleware(PERMISSIONS.DEPARTMENTS_ARCHIVE, PERMISSIONS.DEPARTMENTS_RESTORE, PERMISSIONS.DEPARTMENTS_DELETE),
    departmentController.getArchivedDepartments
);

router.get(
    "/:id",
    authMiddleware,
    departmentController.getDepartment
);

// Regular employees can be delegated departments.create / departments.update
// by an admin and manage this reference data without being ADMIN themselves.
router.post(
    "/",
    authMiddleware,
    permissionMiddleware(PERMISSIONS.DEPARTMENTS_CREATE),
    createDepartmentValidator,
    validationMiddleware,
    departmentController.createDepartment
);

router.put(
    "/:id",
    authMiddleware,
    permissionMiddleware(PERMISSIONS.DEPARTMENTS_UPDATE),
    updateDepartmentValidator,
    validationMiddleware,
    departmentController.updateDepartment
);

// Deactivate (instead of archive)
router.patch(
    "/:id/deactivate",
    authMiddleware,
    permissionMiddleware(PERMISSIONS.DEPARTMENTS_ARCHIVE),
    departmentController.deactivateDepartment
);

// Activate (instead of restore)
router.patch(
    "/:id/activate",
    authMiddleware,
    permissionMiddleware(PERMISSIONS.DEPARTMENTS_RESTORE),
    departmentController.activateDepartment
);

router.delete(
    "/:id/permanent",
    authMiddleware,
    permissionMiddleware(PERMISSIONS.DEPARTMENTS_DELETE),
    departmentController.permanentlyDeleteDepartment
);

export default router;
