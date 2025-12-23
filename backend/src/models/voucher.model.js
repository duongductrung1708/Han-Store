import mongoose from "mongoose";

const voucherSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    description: { type: String },
    discountType: { type: String, enum: ["PERCENT", "FIXED"], required: true },
    discountValue: { type: Number, required: true },
    maxDiscountAmount: { type: Number },
    minOrderValue: { type: Number, default: 0 },
    usageLimit: { type: Number }, // null = unlimited
    usedCount: { type: Number, default: 0 },
    validFrom: { type: Date, required: true },
    validTo: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Note: code field already has unique: true which creates an index automatically

export const Voucher = mongoose.model("Voucher", voucherSchema);


