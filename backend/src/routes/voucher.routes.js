import express from "express";
import {
  createVoucher,
  listVouchers,
  updateVoucher,
  validateVoucherCode,
} from "../controllers/voucher.controller.js";
import { protect, requireRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Admin
router.post("/", protect, requireRole("admin", "staff"), createVoucher);
router.put("/:id", protect, requireRole("admin", "staff"), updateVoucher);
router.get("/", protect, requireRole("admin", "staff"), listVouchers);

// Public: validate code trước khi order
router.post("/validate", validateVoucherCode);

export default router;


