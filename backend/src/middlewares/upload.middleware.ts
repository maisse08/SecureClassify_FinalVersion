import multer from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";
import AppError from "../exceptions/AppError";

// Directory where uploaded attachments are stored (backend/uploads)
const uploadDir = path.join(__dirname, "..", "..", "uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb) => {
        cb(null, uploadDir);
    },
    filename: (req: Request, file: Express.Multer.File, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        const base = path.basename(file.originalname, ext).replace(/\s+/g, "_");
        cb(null, `${base}-${uniqueSuffix}${ext}`);
    },
});

const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    // Accept all file types. Restrict here if needed (e.g. by mimetype).
    cb(null, true);
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 20 * 1024 * 1024, // 20 MB max attachment size
    },
});

// Single attachment field named "pieceJointe"
export const uploadSingleAttachment = upload.single("pieceJointe");

// Wrapper that converts multer errors into AppError for consistent handling
export const uploadAttachment = (req: Request, res: any, next: any) => {
    uploadSingleAttachment(req, res, (err: any) => {
        if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return next(new AppError("Attachment exceeds the maximum allowed size (20 MB)", 400));
            }
            return next(new AppError(err.message, 400));
        } else if (err) {
            return next(err);
        }
        next();
    });
};

// Import supports a whole folder or multiple individually-selected files.
// IMPORTANT: use .any() here, not .array(fieldname, maxCount). Multer's
// .array() enforces maxCount PER FIELD NAME, and once that count is
// exceeded it rejects the extra files with the exact same error as a
// mismatched field name: MulterError "LIMIT_UNEXPECTED_FILE" / "Unexpected
// field". A folder import can easily exceed a small fixed count, so .any()
// (bounded only by the overall "files" limit below) avoids that false
// positive while still only being wired up on this one route.
const importUpload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 20 * 1024 * 1024, // 20 MB max per file
        files: 5000, // overall cap per import (not a per-field cap)
    },
});

const uploadImportFilesRaw = importUpload.any();

// Wrapper that converts multer errors into AppError for consistent handling
export const uploadImportFiles = (req: Request, res: any, next: any) => {
    uploadImportFilesRaw(req, res, (err: any) => {
        if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return next(new AppError("One of the imported files exceeds the maximum allowed size (20 MB)", 400));
            }
            if (err.code === "LIMIT_FILE_COUNT") {
                return next(new AppError("Too many files in this import (maximum 5000)", 400));
            }
            return next(new AppError(err.message, 400));
        } else if (err) {
            return next(err);
        }
        next();
    });
};