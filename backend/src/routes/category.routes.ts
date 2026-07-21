import { Router } from "express";
import  categoryController  from "../controllers/category.controller"; 
import { authMiddleware } from "../middlewares/auth.middleware";
import { permissionMiddleware, anyPermissionMiddleware } from "../middlewares/permission.middleware";
import { validationMiddleware } from "../middlewares/validation.middleware";
import {
    createCategoryValidator,
    updateCategoryValidator
} from "../validators/category.validator";
import { PERMISSIONS } from "../constants/permissions";

const router = Router();

router.get(
    "/",
    authMiddleware,
    categoryController.getCategories
);

// A non-admin user only sees this page (and its data) if an admin has
// delegated an archive/restore permission to them.
router.get(
    "/archived",
    authMiddleware,
    anyPermissionMiddleware(PERMISSIONS.CATEGORIES_ARCHIVE, PERMISSIONS.CATEGORIES_RESTORE, PERMISSIONS.CATEGORIES_DELETE),
    categoryController.getArchivedCategories
);

router.get(
    "/:id",
    authMiddleware,
    categoryController.getCategory
);

// Regular employees can be delegated categories.create / categories.update
// by an admin and manage this reference data without being ADMIN themselves.
router.post(
    "/",
    authMiddleware,
    permissionMiddleware(PERMISSIONS.CATEGORIES_CREATE),
    createCategoryValidator,
    validationMiddleware,
    categoryController.createCategory
);

router.put(
    "/:id",
    authMiddleware,
    permissionMiddleware(PERMISSIONS.CATEGORIES_UPDATE),
    updateCategoryValidator,
    validationMiddleware,
    categoryController.updateCategory
);

// Deactivate (instead of archive)
router.patch(
    "/:id/deactivate",
    authMiddleware,
    permissionMiddleware(PERMISSIONS.CATEGORIES_ARCHIVE),
    categoryController.deactivateCategory
);

// Activate (instead of restore)
router.patch(
    "/:id/activate",
    authMiddleware,
    permissionMiddleware(PERMISSIONS.CATEGORIES_RESTORE),
    categoryController.activateCategory
);

router.delete(
    "/:id/permanent",
    authMiddleware,
    permissionMiddleware(PERMISSIONS.CATEGORIES_DELETE),
    categoryController.permanentlyDeleteCategory
);

export default router;
