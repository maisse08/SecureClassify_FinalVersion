import { body } from "express-validator";

export const createCategoryValidator = [

    body("name")
        .notEmpty()
        .withMessage("Category name is required")
        .isLength({ min: 2, max: 100 })
        .withMessage("Category name must be between 2 and 100 characters"),

    body("description")
        .optional()
        .isLength({ max: 255 })
        .withMessage("Description cannot exceed 255 characters"),

    body("color")
        .optional()
        .isHexColor()
        .withMessage("Color must be a valid hex code")

];

export const updateCategoryValidator = [

    body("name")
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage("Category name must be between 2 and 100 characters"),

    body("description")
        .optional()
        .isLength({ max: 255 })
        .withMessage("Description cannot exceed 255 characters"),

    body("color")
        .optional()
        .isHexColor()
        .withMessage("Color must be a valid hex code")

];
