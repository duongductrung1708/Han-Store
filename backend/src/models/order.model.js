import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    size: { type: String },
    color: { type: String },
    imageUrl: { type: String },
  },
  { _id: false },
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    ward: { type: String },
    district: { type: String },
    city: { type: String, required: true },
    provinceCode: { type: String },
    districtCode: { type: String },
    wardCode: { type: String },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [orderItemSchema],
    shippingAddress: shippingAddressSchema,
    paymentMethod: {
      type: String,
      enum: ["COD", "MOMO"],
      default: "COD",
    },
    paymentInfo: {
      provider: { type: String },
      transactionId: { type: String },
      status: { type: String },
    },
    itemsPrice: { type: Number, required: true },
    shippingPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "SHIPPING", "DELIVERED", "CANCELLED"],
      default: "PENDING",
    },
    cancelledAt: { type: Date },
    voucher: { type: mongoose.Schema.Types.ObjectId, ref: "Voucher" },
    note: { type: String }, // Ghi chú cho đơn hàng
    invoiceInfo: {
      companyName: { type: String },
      taxCode: { type: String },
      email: { type: String },
      address: { type: String },
    },
    paidAt: { type: Date },
    deliveredAt: { type: Date },
    isRefunded: { type: Boolean, default: false },
    refundReason: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

orderSchema.index({ user: 1, createdAt: -1 });

export const Order = mongoose.model("Order", orderSchema);


