import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String },
      },
    ],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

reviewSchema.index({ product: 1, createdAt: -1 });

export const Review = mongoose.model("Review", reviewSchema);


