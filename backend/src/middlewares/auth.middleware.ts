import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
    };
}

export const authMiddleware = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {

    try {

        const authHeader = req.headers.authorization;
        console.log(req.headers.authorization);

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "No token provided"
            });
        }


        const token = authHeader.split(" ")[1];


        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Invalid token format"
            });
        }


        const decoded = jwt.verify(
            token,
            env.JWT_SECRET
        ) as {
            id: string;
            role: string;
        };


        req.user = decoded;


        next();


    } catch (error) {

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });

    }

};