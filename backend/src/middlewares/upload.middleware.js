import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

// Check if Cloudinary is configured
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

// Configure Cloudinary storage
let storage;
if (!cloudName || !apiKey || !apiSecret) {
  console.error(
    "❌ Cloudinary credentials missing! Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env",
  );
  // Use memory storage as fallback (files won't be uploaded to Cloudinary)
  storage = multer.memoryStorage();
  console.warn("⚠️  Using memory storage as fallback. Files will not be persisted.");
} else {
  try {
    // Verify Cloudinary config before creating storage
    console.log("Initializing CloudinaryStorage...");
    console.log("Cloud name:", cloudName);
    console.log("API Key:", apiKey ? `${apiKey.substring(0, 5)}...` : "missing");
    
    storage = new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: "han-store/products",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        resource_type: "image",
      },
    });
    console.log("✅ Cloudinary storage initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize CloudinaryStorage:", error.message);
    console.error("Error details:", error);
    // Fallback to memory storage
    storage = multer.memoryStorage();
    console.warn("⚠️  Using memory storage as fallback due to Cloudinary initialization error.");
  }
}

// File filter
const fileFilter = (req, file, cb) => {
  try {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(
      file.originalname.toLowerCase().split(".").pop(),
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files (jpeg, jpg, png, webp) are allowed!"));
    }
  } catch (error) {
    console.error("File filter error:", error);
    cb(error);
  }
};

// Configure multer
export const uploadSingle = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: fileFilter,
});

export const uploadMultiple = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
  },
  fileFilter: fileFilter,
});

