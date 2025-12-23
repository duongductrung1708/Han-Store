import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Note: slug field already has unique: true which creates an index automatically

export const Category = mongoose.model("Category", categorySchema);


