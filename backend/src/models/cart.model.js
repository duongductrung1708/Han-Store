import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
    size: { type: String },
    color: { type: String },
  },
  { _id: false },
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
    // Lưu sẵn tổng tiền để query nhanh
    itemsPrice: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Note: user field already has unique: true which creates an index automatically

export const Cart = mongoose.model("Cart", cartSchema);


