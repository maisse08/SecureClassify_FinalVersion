import { body } from "express-validator";

export const verifyMfaValidator = [
    body("email")
        .isEmail()
        .withMessage("Invalid email"),

    body("otp")
        .isLength({ min: 6, max: 6 })
        .withMessage("OTP must be 6 digits")
        .isNumeric()
        .withMessage("OTP must contain only numbers"),
];

export const resendMfaValidator = [
    body("email")
        .isEmail()
        .withMessage("Invalid email"),
];