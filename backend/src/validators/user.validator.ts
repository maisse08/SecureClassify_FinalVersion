import { body } from "express-validator";
import { ROLES } from "../constants/roles";

export const createUserValidator = [
    body("firstName")
        .notEmpty()
        .withMessage("First name is required"),

    body("lastName")
        .notEmpty()
        .withMessage("Last name is required"),

    body("email")
        .isEmail()
        .withMessage("Invalid email"),

    body("password")
        .isLength({ min: 8 })
        .withMessage("Password must contain at least 8 characters"),

    body("role")
        .optional()
        .isIn(Object.values(ROLES))
        .withMessage(`Role must be one of: ${Object.values(ROLES).join(", ")}`),

    body("department")
        .custom((value, { req }) => {
            const role = req.body.role ?? ROLES.EMPLOYEE;
            if (role !== ROLES.ADMIN && !value) {
                throw new Error("Department is required for non-admin users");
            }
            return true;
        }),
];

export const updateUserValidator = [
    body("firstName")
        .optional()
        .notEmpty()
        .withMessage("First name cannot be empty"),

    body("lastName")
        .optional()
        .notEmpty()
        .withMessage("Last name cannot be empty"),

    body("email")
        .optional()
        .isEmail()
        .withMessage("Invalid email"),

    body("password")
        .optional()
        .isLength({ min: 8 })
        .withMessage("Password must contain at least 8 characters"),

    body("role")
        .optional()
        .isIn(Object.values(ROLES))
        .withMessage(`Role must be one of: ${Object.values(ROLES).join(", ")}`),

    body("department")
        .optional()
        .notEmpty()
        .withMessage("Department is required for non-admin users"),
];
