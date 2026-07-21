import { body } from "express-validator";

export const createDepartmentValidator = [

    body("name")
        .notEmpty()
        .withMessage("Department name is required")
        .isLength({ min: 2, max: 100 })
        .withMessage("Department name must be between 2 and 100 characters"),

    body("code")
        .notEmpty()
        .withMessage("Department code is required")
        .isLength({ min: 2, max: 10 })
        .withMessage("Department code must be between 2 and 10 characters"),

    body("description")
        .optional()
        .isLength({ max: 255 })
        .withMessage("Description cannot exceed 255 characters")

];


export const updateDepartmentValidator = [

    body("name")
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage("Department name must be between 2 and 100 characters"),

    body("code")
        .optional()
        .isLength({ min: 2, max: 10 })
        .withMessage("Department code must be between 2 and 10 characters"),

    body("description")
        .optional()
        .isLength({ max: 255 })
        .withMessage("Description cannot exceed 255 characters")

];