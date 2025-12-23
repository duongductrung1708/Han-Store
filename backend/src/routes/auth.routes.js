import express from "express";
import { body } from "express-validator";
import {
  login,
  logout,
  refreshToken,
  register,
  requestPasswordReset,
  resetPasswordWithOtp,
} from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Min 6 chars password"),
    body("gender")
      .optional()
      .isIn(["male", "female", "other"])
      .withMessage("Gender must be male, female, or other"),
    body("dateOfBirth")
      .optional()
      .isISO8601()
      .withMessage("Date of birth must be a valid date"),
  ],
  register,
);

router.post(
  "/login",
  [
    body("email").isEmail(),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  login,
);

router.post("/refresh-token", refreshToken);
router.post("/logout", protect, logout);

router.post(
  "/forgot-password",
  [body("email").isEmail().withMessage("Valid email is required")],
  requestPasswordReset,
);

router.post(
  "/reset-password-otp",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("otp").notEmpty().withMessage("OTP is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  resetPasswordWithOtp,
);

export default router;


