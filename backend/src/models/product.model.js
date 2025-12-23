import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String },
  },
  { _id: false },
);

const variantSchema = new mongoose.Schema(
  {
    size: { type: String },
    color: { type: String },
    stock: { type: Number, default: 0 },
  },
  { _id: false },
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String }, // rich text (HTML) lưu dạng string
    price: { type: Number, required: true },
    salePrice: { type: Number },
    images: [imageSchema],
    variants: [variantSchema],
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
    tags: [{ type: String }],
    totalStock: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Text search index for name only (tags is array, cannot be in text index)
productSchema.index({ name: "text" });
// Index for tags array (for filtering)
productSchema.index({ tags: 1 });
// Note: slug field already has unique: true which creates an index automatically

export const Product = mongoose.model("Product", productSchema);


