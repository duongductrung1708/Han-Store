/**
 * Script để tạo tài khoản admin
 * Chạy: node src/scripts/createAdmin.js
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { connectDB } from "../config/db.js";

dotenv.config();

const createAdmin = async () => {
  try {
    // Kết nối database
    await connectDB();

    const adminEmail = process.env.ADMIN_EMAIL || "admin@hanstore.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123456";
    const adminName = process.env.ADMIN_NAME || "Admin";

    // Kiểm tra xem admin đã tồn tại chưa
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      if (existingAdmin.role === "admin") {
        console.log("✅ Admin đã tồn tại!");
        console.log(`   Email: ${adminEmail}`);
        console.log(`   Role: ${existingAdmin.role}`);
        process.exit(0);
      } else {
        // Nếu user tồn tại nhưng không phải admin, cập nhật role
        existingAdmin.role = "admin";
        await existingAdmin.save();
        console.log("✅ Đã cập nhật user thành admin!");
        console.log(`   Email: ${adminEmail}`);
        console.log(`   Role: ${existingAdmin.role}`);
        process.exit(0);
      }
    }

    // Tạo admin mới
    const admin = await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: "admin",
      isEmailVerified: true,
    });

    console.log("✅ Đã tạo tài khoản admin thành công!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Role: ${admin.role}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("⚠️  Lưu ý: Vui lòng đổi mật khẩu sau khi đăng nhập!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi khi tạo admin:", error.message);
    process.exit(1);
  }
};

createAdmin();

