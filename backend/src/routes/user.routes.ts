import { Router } from "express";
import userController from "../controllers/user.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { validationMiddleware } from "../middlewares/validation.middleware";
import { createUserValidator, updateUserValidator } from "../validators/user.validator";
import { ROLES } from "../constants/roles";
import { PERMISSIONS } from "../constants/permissions";
import { permissionMiddleware } from "../middlewares/permission.middleware";

const router = Router();

// Note: permissionMiddleware always lets ADMIN through, then falls back to
// checking the user's granted `permissions` array. This is what allows an
// admin to delegate these actions to a regular user (cahier de charges:
// "only admin can give a user the permission to add a user, or manage some
// user's data, or manage history/trash").

router.get(
    "/",
    authMiddleware,
    permissionMiddleware(PERMISSIONS.USERS_VIEW_OTHERS),
    userController.getUsers
);

router.get(
    "/me",
    authMiddleware,
    userController.getProfile
);

router.put(
    "/me",
    authMiddleware,
    userController.updateProfile
);


router.get(
    "/:id",
    authMiddleware,
    permissionMiddleware(PERMISSIONS.USERS_VIEW_OTHERS),
    userController.getUser
);


router.post(
    "/",
    authMiddleware,
    permissionMiddleware(PERMISSIONS.USERS_CREATE),
    createUserValidator,
    validationMiddleware,
    userController.createUser
);

router.put(
    "/change-password",
    authMiddleware,
    userController.changePassword
);

router.put(
    "/:id",
    authMiddleware,
    permissionMiddleware(PERMISSIONS.USERS_UPDATE),
    userController.updateUser
);


router.delete(
    "/:id",
    authMiddleware,
    permissionMiddleware(PERMISSIONS.USERS_DELETE),
    userController.deleteUser
);


// Permissions management (admin only)
router.post(
    "/:id/permissions",
    authMiddleware,
    roleMiddleware(ROLES.ADMIN),
    userController.addPermission
);

router.delete(
    "/:id/permissions/:permission",
    authMiddleware,
    roleMiddleware(ROLES.ADMIN),
    userController.removePermission
);

export default router;