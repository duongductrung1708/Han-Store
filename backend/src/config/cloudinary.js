import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

// Ensure dotenv is loaded (in case this module is imported before dotenv.config() in server.js)
dotenv.config();

// Check if Cloudinary is configured
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.warn(
    "⚠️  Cloudinary credentials not found. Image upload will not work. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env file.",
  );
  console.warn("Current values:", {
    cloudName: cloudName || "missing",
    apiKey: apiKey ? `${apiKey.substring(0, 5)}...` : "missing",
    apiSecret: apiSecret ? "***" : "missing",
  });
} else {
  console.log("✅ Cloudinary credentials found");
  console.log("Cloud name:", cloudName);
  console.log("API Key:", `${apiKey.substring(0, 5)}...`);
}

cloudinary.config({
  cloud_name: cloudName || "",
  api_key: apiKey || "",
  api_secret: apiSecret || "",
});

export default cloudinary;

