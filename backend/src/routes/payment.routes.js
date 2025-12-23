import express from "express";
import {
  createMomoPaymentFromCart,
  handleMomoIpn,
} from "../controllers/payment.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// User chọn thanh toán MoMo từ giỏ hàng
router.post("/momo", protect, createMomoPaymentFromCart);

// IPN callback từ MoMo (không cần auth)
router.post("/momo-ipn", handleMomoIpn);

export default router;


