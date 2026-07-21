import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import userRepository from "../repositories/user.repository";
import { ROLES } from "../constants/roles";

export const permissionMiddleware = (permission: string) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const user = req.user;

            if (!user) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            if (user.role === ROLES.ADMIN) {
                return next();
            }

            const dbUser = await userRepository.findById(user.id);

            if (!dbUser) {
                return res.status(404).json({ success: false, message: "User not found" });
            }

            const permissions: string[] = dbUser.permissions || [];

            if (permissions.includes(permission)) {
                return next();
            }

            return res.status(403).json({ success: false, message: "Forbidden" });

        } catch (error) {
            return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Server error" });
        }
    };
};

// Same as permissionMiddleware, but grants access if the user holds ANY of
// the given permissions (or is ADMIN). Useful for endpoints such as the
// reference-data archive views, which several distinct delegated
// permissions (archive/restore) should both be able to reach.
export const anyPermissionMiddleware = (...permissions: string[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const user = req.user;

            if (!user) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            if (user.role === ROLES.ADMIN) {
                return next();
            }

            const dbUser = await userRepository.findById(user.id);

            if (!dbUser) {
                return res.status(404).json({ success: false, message: "User not found" });
            }

            const userPermissions: string[] = dbUser.permissions || [];

            if (permissions.some((p) => userPermissions.includes(p))) {
                return next();
            }

            return res.status(403).json({ success: false, message: "Forbidden" });
        } catch (error) {
            return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Server error" });
        }
    };
};

export default permissionMiddleware;