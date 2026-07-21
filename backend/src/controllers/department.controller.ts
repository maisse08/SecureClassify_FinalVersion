import { Request, Response } from "express";
import departmentService from "../services/department.service";
import asyncHandler from "../utils/asyncHandler";

class DepartmentController {

    getDepartments = asyncHandler(async (req: Request, res: Response) => {

        const departments =
            await departmentService.getAllDepartments();

        res.status(200).json({

            success: true,

            data: departments

        });

    });

    getArchivedDepartments = asyncHandler(async (req: Request, res: Response) => {

        const departments =
            await departmentService.getArchivedDepartments();

        res.status(200).json({

            success: true,

            data: departments

        });

    });

    getDepartment = asyncHandler(async (req: Request, res: Response) => {

        const department =
            await departmentService.getDepartmentById(
                req.params.id as string
            );

        res.status(200).json({

            success: true,

            data: department

        });

    });

    createDepartment = asyncHandler(async (req: Request, res: Response) => {

        const department =
            await departmentService.createDepartment(
                req.body
            );

        res.status(201).json({

            success: true,

            message: "Department created successfully",

            data: department

        });

    });

    updateDepartment = asyncHandler(async (req: Request, res: Response) => {

        const department =
            await departmentService.updateDepartment(
                req.params.id as string,
                req.body
            );

        res.status(200).json({

            success: true,

            message: "Department updated successfully",

            data: department

        });

    });

    deactivateDepartment = asyncHandler(async (req: Request, res: Response) => {

        const department = await departmentService.deactivateDepartment(
            req.params.id as string
        );

        res.status(200).json({
            success: true,
            message: "Department deactivated successfully",
            data: department
        });

    });

    activateDepartment = asyncHandler(async (req: Request, res: Response) => {

        const department = await departmentService.activateDepartment(
            req.params.id as string
        );

        res.status(200).json({
            success: true,
            message: "Department activated successfully",
            data: department
        });

    });

    permanentlyDeleteDepartment = asyncHandler(async (req: Request, res: Response) => {

        await departmentService.permanentlyDeleteDepartment(
            req.params.id as string
        );

        res.status(200).json({
            success: true,
            message: "Department permanently deleted"
        });

    });

}

export default new DepartmentController();
