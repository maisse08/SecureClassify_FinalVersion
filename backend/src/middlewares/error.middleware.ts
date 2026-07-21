import { NextFunction, Request, Response } from "express";
import AppError from "../exceptions/AppError";

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void => {

    console.error(err);

    if (err instanceof AppError) {

        res.status(err.statusCode).json({

            success: false,

            message: err.message

        });

        return;

    }

    res.status(500).json({

        success: false,

        message: "Internal Server Error"

    });

};