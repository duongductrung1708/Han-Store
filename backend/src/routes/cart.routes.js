import express from "express";
import {
  clearCart,
  getMyCart,
  removeCartItem,
  upsertCartItem,
} from "../controllers/cart.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", protect, getMyCart);
router.post("/items", protect, upsertCartItem);
router.delete("/items", protect, removeCartItem);
router.delete("/", protect, clearCart);

export default router;


