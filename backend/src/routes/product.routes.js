import express from "express";
import { body } from "express-validator";
import {
  createProduct,
  deleteProduct,
  getProductDetail,
  listProducts,
  updateProduct,
} from "../controllers/product.controller.js";
import { protect, requireRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", listProducts);
router.get("/:idOrSlug", getProductDetail);

// Admin
router.post(
  "/",
  protect,
  requireRole("admin", "staff"),
  [body("name").notEmpty(), body("price").isNumeric(), body("slug").notEmpty()],
  createProduct,
);

router.put(
  "/:id",
  protect,
  requireRole("admin", "staff"),
  updateProduct,
);

router.delete(
  "/:id",
  protect,
  requireRole("admin", "staff"),
  deleteProduct,
);

export default router;


