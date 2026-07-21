import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import { Role } from "../constants/roles";


export const roleMiddleware = (...allowedRoles: Role[]) => {

    return (
        req: AuthRequest,
        res: Response,
        next: NextFunction
    ) => {


        if (!req.user) {

            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });

        }


        if (!allowedRoles.includes(req.user.role as Role)) {

            return res.status(403).json({
                success: false,
                message: "Forbidden: insufficient permissions"
            });

        }


        next();

    };

};