import dotenv from "dotenv";

dotenv.config();

export const env = {
    PORT: Number(process.env.PORT) || 5000,

    MONGODB_URI:
        process.env.MONGODB_URI ||
        "mongodb://127.0.0.1:27017/secureclassify",

    JWT_SECRET:
        process.env.JWT_SECRET ||
        "YourSuperSecretKey",

    JWT_EXPIRES_IN:
        process.env.JWT_EXPIRES_IN || "1d",
};