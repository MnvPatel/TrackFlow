import type { Request, Response, NextFunction } from "express";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB per file
});

/**
 * Runs multer only when Content-Type is multipart/form-data.
 * Parses fields: description, percentReported (text), and media[] (files).
 */
export function optionalSubmissionUpload(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const contentType = req.headers["content-type"] || "";
  if (!contentType.includes("multipart/form-data")) {
    next();
    return;
  }
  const mw = upload.fields([{ name: "media", maxCount: 10 }]);
  mw(req, res, next);
}
