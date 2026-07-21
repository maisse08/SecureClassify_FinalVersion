import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import categoryService from "../services/category.service";

class CategoryController {

    getCategories = asyncHandler(async (req: Request, res: Response) => {

        const categories =
            await categoryService.getAllCategories();

        res.status(200).json({

            success: true,

            data: categories

        });

    });

    getArchivedCategories = asyncHandler(async (req: Request, res: Response) => {

        const categories =
            await categoryService.getArchivedCategories();

        res.status(200).json({

            success: true,

            data: categories

        });

    });

    getCategory = asyncHandler(async (req: Request, res: Response) => {

        const category =
            await categoryService.getCategoryById(
                req.params.id as string
            );

        res.status(200).json({

            success: true,

            data: category

        });

    });

    createCategory = asyncHandler(async (req: Request, res: Response) => {

        const category =
            await categoryService.createCategory(
                req.body
            );

        res.status(201).json({

            success: true,

            message: "Category created successfully",

            data: category

        });

    });

    updateCategory = asyncHandler(async (req: Request, res: Response) => {

        const category =
            await categoryService.updateCategory(

                req.params.id as string,

                req.body

            );

        res.status(200).json({

            success: true,

            message: "Category updated successfully",

            data: category

        });

    });

    deactivateCategory = asyncHandler(async (req: Request, res: Response) => {

        const category = await categoryService.deactivateCategory(
            req.params.id as string
        );

        res.status(200).json({
            success: true,
            message: "Category deactivated successfully",
            data: category
        });

    });

    activateCategory = asyncHandler(async (req: Request, res: Response) => {

        const category = await categoryService.activateCategory(
            req.params.id as string
        );

        res.status(200).json({
            success: true,
            message: "Category activated successfully",
            data: category
        });

    });

    permanentlyDeleteCategory = asyncHandler(async (req: Request, res: Response) => {

        await categoryService.permanentlyDeleteCategory(
            req.params.id as string
        );

        res.status(200).json({
            success: true,
            message: "Category permanently deleted"
        });

    });

}

export default new CategoryController();
