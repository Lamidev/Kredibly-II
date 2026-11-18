import { Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { ENV } from "../config/env";
import { AppError } from "../middleware/errorHandler";

const uploadDir = path.resolve(ENV.UPLOAD_DIR, "products");

// Ensure directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const safeExt = ALLOWED_MIME_TO_EXT[file.mimetype.toLowerCase()] || ".webp";
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `prod-${uniqueSuffix}${safeExt}`);
  },
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (Object.prototype.hasOwnProperty.call(ALLOWED_MIME_TO_EXT, file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new AppError("Only JPG, PNG, and WebP images are allowed", 400));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max ceiling (client compresses to <100KB)
    files: 2, // Maximum 2 images per upload
  },
});

export class UploadController {
  static async uploadImages(req: Request, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        throw new AppError("No image files provided", 400);
      }

      if (files.length > 2) {
        throw new AppError("Maximum of 2 images allowed per product", 400);
      }

      const urls = files.map((file) => `/uploads/products/${file.filename}`);

      return res.status(200).json({
        success: true,
        message: "Images uploaded successfully",
        urls,
      });
    } catch (error) {
      next(error);
    }
  }
}
