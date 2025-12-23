import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import { Product } from "../models/product.model.js";

dotenv.config();

const dropIndexes = async () => {
  try {
    console.log("🗑️  Dropping old indexes...\n");
    await connectDB();

    // Drop all indexes except _id
    await Product.collection.dropIndexes();
    console.log("✓ Dropped all indexes from products collection");

    // Recreate correct indexes
    await Product.collection.createIndex({ name: "text" });
    await Product.collection.createIndex({ tags: 1 });
    console.log("✓ Recreated indexes");

    console.log("\n✅ Done!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed:", error);
    process.exit(1);
  }
};

dropIndexes();

