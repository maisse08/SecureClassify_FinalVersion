import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import userService from "../services/user.service";
import asyncHandler from "../utils/asyncHandler";

class UserController {

    getUsers = asyncHandler(async (req: Request, res: Response) => {

        const users =
            await userService.getAllUsers();

        res.status(200).json({

            success: true,

            data: users

        });

    });




    getUser = asyncHandler(async (req: Request, res: Response) => {

        const user =
            await userService.getUserById(
                req.params.id as string
            );

        res.status(200).json({

            success: true,

            data: user

        });

    });




    createUser = asyncHandler(async (req: Request, res: Response) => {

        const authReq = req as AuthRequest;

        const user =
            await userService.createUser(
                req.body,
                authReq.user
            );

        res.status(201).json({

            success: true,

            message: "User created successfully",

            data: user

        });

    });




    updateUser = asyncHandler(async (req: Request, res: Response) => {

        const authReq = req as AuthRequest;

        const user =
            await userService.updateUser(
                req.params.id as string,
                req.body,
                authReq.user
            );

        res.status(200).json({

            success: true,

            message: "User updated successfully",

            data: user

        });

    });




    deleteUser = asyncHandler(async (req: Request, res: Response) => {

        await userService.deleteUser(
            req.params.id as string
        );

        res.status(200).json({

            success: true,

            message: "User deleted successfully"

        });

    });




    getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {

        const user =
            await userService.getProfile(
                req.user!.id
            );

        res.status(200).json({

            success: true,

            data: user

        });

    });




    updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
        const user = await userService.updateProfile(
            req.user!.id,
            req.body
        );

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: user,
        });
    });

    changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {

        const result =
            await userService.changePassword(

                req.user!.id,

                req.body.currentPassword,

                req.body.newPassword

            );

        res.status(200).json({

            success: true,

            message: result.message

        });

    });


    addPermission = asyncHandler(async (req: Request, res: Response) => {

        const result = await userService.addPermission(
            req.params.id as string,
            req.body.permission as string
        );

        res.status(200).json({
            success: true,
            message: "Permission added",
            data: result
        });

    });


    removePermission = asyncHandler(async (req: Request, res: Response) => {

        const result = await userService.removePermission(
            req.params.id as string,
            req.params.permission as string
        );

        res.status(200).json({
            success: true,
            message: "Permission removed",
            data: result
        });

    });

}

export default new UserController();