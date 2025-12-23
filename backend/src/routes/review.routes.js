import express from "express";
import {
  canReviewProduct,
  createReview,
  getMyReviewForProduct,
  listProductReviews,
  updateReview,
  deleteReview,
} from "../controllers/review.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/product/:productId", listProductReviews);
router.get("/product/:productId/can-review", protect, canReviewProduct);
router.post("/", protect, createReview);
router.get("/my", protect, getMyReviewForProduct);
router.put("/:id", protect, updateReview);
router.delete("/:id", protect, deleteReview);

export default router;


