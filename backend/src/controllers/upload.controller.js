import cloudinary from "../config/cloudinary.js";

// Upload single image to Cloudinary
export const uploadImage = async (req, res, next) => {
  try {
    console.log("=== Upload Image Request ===");
    console.log("File:", req.file);
    console.log("File keys:", req.file ? Object.keys(req.file) : "No file");

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Check if using memory storage (buffer exists)
    // If so, upload directly to Cloudinary
    if (req.file.buffer) {
      console.log("File in memory storage, uploading directly to Cloudinary...");
      
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;

      console.log("Checking Cloudinary credentials...");
      console.log("Cloud name:", cloudName ? `${cloudName.substring(0, 5)}...` : "MISSING");
      console.log("API Key:", apiKey ? `${apiKey.substring(0, 5)}...` : "MISSING");
      console.log("API Secret:", apiSecret ? "***" : "MISSING");

      if (!cloudName || !apiKey || !apiSecret) {
        return res.status(503).json({
          success: false,
          message: "Cloudinary is not configured. Please use image URL input instead, or configure Cloudinary credentials in .env file.",
        });
      }

      // Ensure Cloudinary is configured before uploading
      // Re-config in case it wasn't loaded properly
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });

      console.log("Cloudinary config verified. Uploading...");

      // Upload buffer directly to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
        {
          folder: "han-store/products",
          resource_type: "image",
        }
      );

      return res.json({
        success: true,
        data: {
          url: uploadResult.secure_url || uploadResult.url,
          publicId: uploadResult.public_id || "",
        },
      });
    }

    // multer-storage-cloudinary stores result in req.file
    // The structure: req.file.path contains the Cloudinary URL
    // req.file.filename contains the public_id
    const url = req.file.path || req.file.url || req.file.secure_url;
    const publicId = req.file.filename || req.file.public_id || "";

    console.log("Extracted URL:", url);
    console.log("Extracted publicId:", publicId);

    if (!url) {
      console.error("Upload result structure:", JSON.stringify(req.file, null, 2));
      return res.status(500).json({
        success: false,
        message: "Failed to get uploaded image URL. Please check server logs.",
      });
    }

    res.json({
      success: true,
      data: {
        url,
        publicId,
      },
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload image",
    });
  }
};

// Upload multiple images to Cloudinary
export const uploadImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    const uploadPromises = req.files.map(async (file) => {
      // If file has buffer, upload directly to Cloudinary
      if (file.buffer) {
        if (!cloudName || !apiKey || !apiSecret) {
          throw new Error("Cloudinary is not configured");
        }

        // Ensure Cloudinary is configured before uploading
        cloudinary.config({
          cloud_name: cloudName,
          api_key: apiKey,
          api_secret: apiSecret,
        });

        const uploadResult = await cloudinary.uploader.upload(
          `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
          {
            folder: "han-store/products",
            resource_type: "image",
          }
        );

        return {
          url: uploadResult.secure_url || uploadResult.url,
          publicId: uploadResult.public_id || "",
        };
      }

      // multer-storage-cloudinary already uploaded the file
      return {
        url: file.path || file.url,
        publicId: file.filename || file.public_id,
      };
    });

    const results = await Promise.all(uploadPromises);

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload images",
    });
  }
};

