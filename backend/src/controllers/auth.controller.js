import crypto from "crypto";
import { validationResult } from "express-validator";
import { User } from "../models/user.model.js";
import { signAccessToken, signRefreshToken } from "../utils/jwt.js";
import { sendOtpEmail } from "../services/email.service.js";

// Helper: format response user
const buildUserPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatarUrl: user.avatarUrl,
  gender: user.gender,
  dateOfBirth: user.dateOfBirth,
});

// Helper: send tokens via cookie + body
const sendAuthResponse = (res, user, message) => {
  const accessToken = signAccessToken({ id: user._id, role: user.role });
  const refreshToken = signRefreshToken({ id: user._id });

  user.refreshToken = refreshToken;
  user.save({ validateBeforeSave: false });

  // Cookie options for cross-domain support
  const isProduction = process.env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction, // HTTPS required in production
    sameSite: isProduction ? "none" : "lax", // "none" allows cross-domain cookies
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  };

  res
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json({
      success: true,
      message,
      data: {
        user: buildUserPayload(user),
        accessToken,
        refreshToken,
      },
    });
};

export const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password, gender, dateOfBirth } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email này đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập." });
    }

    const userData = { name, email, password };
    if (gender) userData.gender = gender;
    if (dateOfBirth) userData.dateOfBirth = new Date(dateOfBirth);

    const user = await User.create(userData);

    sendAuthResponse(res, user, "Register successfully");
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.isDeleted) {
      return res
        .status(400)
        .json({ success: false, message: "Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại." });
    }

    sendAuthResponse(res, user, "Login successfully");
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const token =
      req.cookies?.refreshToken || req.body.refreshToken || req.query.token;

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "No refresh token provided" });
    }

    const user = await User.findOne({ refreshToken: token });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid refresh token" });
    }

    sendAuthResponse(res, user, "Token refreshed");
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user.id, { refreshToken: null });
    }

    res
      .clearCookie("accessToken")
      .clearCookie("refreshToken")
      .json({ success: true, message: "Logged out" });
  } catch (error) {
    next(error);
  }
};

// Quên mật khẩu (simple version: generate OTP code, lưu vào user, gửi email sau này)
export const requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    user.otpCode = otp;
    user.otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save({ validateBeforeSave: false });

    // Gửi OTP qua email
    try {
      await sendOtpEmail({
        email: user.email,
        name: user.name,
        otp,
      });
    } catch (emailError) {
      // Log lỗi nhưng vẫn trả về success để không lộ thông tin user
      console.error("Failed to send OTP email:", emailError);
      // Trong production, có thể muốn xử lý khác (ví dụ: retry queue)
    }

    res.json({
      success: true,
      message: "Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.",
    });
  } catch (error) {
    next(error);
  }
};

export const resetPasswordWithOtp = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email, otpCode: otp });

    if (!user || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP" });
    }

    user.password = newPassword;
    user.otpCode = null;
    user.otpExpiresAt = null;
    await user.save();

    res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    next(error);
  }
};


