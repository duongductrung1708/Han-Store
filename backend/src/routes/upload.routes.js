import express from "express";
import { protect, requireRole } from "../middlewares/auth.middleware.js";
import { uploadSingle, uploadMultiple } from "../middlewares/upload.middleware.js";
import { uploadImage, uploadImages } from "../controllers/upload.controller.js";

const router = express.Router();

// Error handler for multer
const handleMulterError = (err, req, res, next) => {
  if (err) {
    console.error("Multer error:", err);
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File size too large. Maximum size is 5MB.",
      });
    }
    if (err.message) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: "File upload error",
    });
  }
  next();
};

// Avatar upload for authenticated users
router.post(
  "/avatar",
  protect,
  uploadSingle.single("avatar"),
  handleMulterError,
  uploadImage,
);

// Admin only routes
router.post(
  "/image",
  protect,
  requireRole("admin", "staff"),
  uploadSingle.single("image"),
  handleMulterError,
  uploadImage,
);

router.post(
  "/images",
  protect,
  requireRole("admin", "staff"),
  uploadMultiple.array("images", 10), // Max 10 images
  handleMulterError,
  uploadImages,
);

// Review images: allow authenticated users to upload up to 5 images
router.post(
  "/review-images",
  protect,
  uploadMultiple.array("images", 5),
  handleMulterError,
  uploadImages,
);

export default router;

