import express from "express";
import { body } from "express-validator";
import {
  changePassword,
  deleteAddress,
  getAddresses,
  getProfile,
  listUsers,
  updateProfile,
  upsertAddress,
} from "../controllers/user.controller.js";
import { protect, requireRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/me", protect, getProfile);

router.put(
  "/me",
  protect,
  [
    body("name").optional().isLength({ min: 2 }),
    body("gender").optional().isIn(["male", "female", "other"]),
    body("dateOfBirth").optional().isISO8601(),
  ],
  updateProfile,
);

router.put(
  "/me/password",
  protect,
  [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters"),
  ],
  changePassword,
);

router.get("/me/addresses", protect, getAddresses);
router.post("/me/addresses", protect, upsertAddress);
router.delete("/me/addresses/:index", protect, deleteAddress);

// Admin
router.get("/", protect, requireRole("admin"), listUsers);

export default router;


