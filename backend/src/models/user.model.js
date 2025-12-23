import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const addressSchema = new mongoose.Schema(
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
    isDefault: { type: Boolean, default: false },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    dateOfBirth: { type: Date },
    role: {
      type: String,
      enum: ["user", "admin", "staff"],
      default: "user",
    },
    avatarUrl: { type: String },
    addresses: [addressSchema],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    invoiceInfo: {
      companyName: { type: String },
      taxCode: { type: String },
      email: { type: String },
      address: { type: String },
    },
    isEmailVerified: { type: Boolean, default: false },
    otpCode: { type: String },
    otpExpiresAt: { type: Date },
    refreshToken: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Note: email field already has unique: true which creates an index automatically

// Hash password before save
userSchema.pre("save", async function preSave(next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  return next();
});

// Custom method to compare password
userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model("User", userSchema);


