import express from "express";
import {
  createOrderFromCart,
  listAllOrders,
  listMyOrders,
  updateOrderStatus,
  cancelMyOrder,
} from "../controllers/order.controller.js";
import { protect, requireRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", protect, createOrderFromCart);
router.get("/me", protect, listMyOrders);
router.post("/:id/cancel", protect, cancelMyOrder);

// Admin
router.get("/", protect, requireRole("admin", "staff"), listAllOrders);
router.put(
  "/:id/status",
  protect,
  requireRole("admin", "staff"),
  updateOrderStatus,
);

export default router;


