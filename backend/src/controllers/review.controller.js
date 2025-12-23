import mongoose from "mongoose";
import { Review } from "../models/review.model.js";
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";

const updateProductRating = async (productId) => {
  if (!productId) return;
  let objectId;
  try {
    objectId = new mongoose.Types.ObjectId(productId);
  } catch (e) {
    return;
  }

  const stats = await Review.aggregate([
    {
      $match: {
        product: objectId,
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: "$product",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const avg = stats[0]?.averageRating || 0;
  const total = stats[0]?.totalReviews || 0;

  await Product.findByIdAndUpdate(productId, {
    averageRating: Number(avg.toFixed(2)),
    totalReviews: total,
  });
};

export const createReview = async (req, res, next) => {
  try {
    const { productId, rating, comment, images } = req.body;

    // Kiểm tra xem user đã mua sản phẩm này chưa và đã nhận hàng chưa
    const hasPurchased = await Order.findOne({
      user: req.user.id,
      status: "DELIVERED",
      "items.product": productId,
      isDeleted: false,
    });

    if (!hasPurchased) {
      return res.status(403).json({
        success: false,
        message: "Bạn chỉ có thể đánh giá sản phẩm sau khi đã mua và nhận hàng.",
      });
    }

    // Kiểm tra xem user đã đánh giá sản phẩm này chưa
    const existingReview = await Review.findOne({
      user: req.user.id,
      product: productId,
      isDeleted: false,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "Bạn đã đánh giá sản phẩm này rồi.",
      });
    }

    let parsedImages = [];
    if (Array.isArray(images)) {
      parsedImages = images
        .slice(0, 5)
        .map((img) => ({
          url: img.url || img,
          publicId: img.publicId,
        }))
        .filter((img) => !!img.url);
    }

    const review = await Review.create({
      user: req.user.id,
      product: productId,
      rating,
      comment,
      images: parsedImages,
    });

    await updateProductRating(productId);

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

// Xóa review (soft delete) của chính user
export const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await Review.findOne({
      _id: id,
      user: req.user.id,
      isDeleted: false,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    review.isDeleted = true;
    await review.save();
    await updateProductRating(review.product);

    res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    next(error);
  }
};

// Lấy review của chính user cho 1 sản phẩm (nếu có)
export const getMyReviewForProduct = async (req, res, next) => {
  try {
    const { productId } = req.query;
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "productId is required",
      });
    }

    const review = await Review.findOne({
      user: req.user.id,
      product: productId,
      isDeleted: false,
    });

    res.json({ success: true, data: review || null });
  } catch (error) {
    next(error);
  }
};

// Cập nhật review (cho phép chỉnh sửa)
export const updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment, images } = req.body;

    const review = await Review.findOne({
      _id: id,
      user: req.user.id,
      isDeleted: false,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    let parsedImages = review.images || [];
    if (Array.isArray(images)) {
      parsedImages = images
        .slice(0, 5)
        .map((img) => ({
          url: img.url || img,
          publicId: img.publicId,
        }))
        .filter((img) => !!img.url);
    }

    review.rating = rating ?? review.rating;
    review.comment = comment ?? review.comment;
    review.images = parsedImages;

    await review.save();
    await updateProductRating(review.product);

    res.json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

export const listProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.find({
      product: productId,
      isDeleted: false,
    })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};

// Kiểm tra xem user có thể đánh giá sản phẩm không
export const canReviewProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.json({ success: true, data: { canReview: false, reason: "not_logged_in" } });
    }

    // Kiểm tra xem user đã mua sản phẩm này chưa và đã nhận hàng chưa
    const hasPurchased = await Order.findOne({
      user: userId,
      status: "DELIVERED",
      "items.product": productId,
      isDeleted: false,
    });

    if (!hasPurchased) {
      return res.json({
        success: true,
        data: { canReview: false, reason: "not_purchased_or_not_delivered" },
      });
    }

    // Kiểm tra xem user đã đánh giá sản phẩm này chưa
    const existingReview = await Review.findOne({
      user: userId,
      product: productId,
      isDeleted: false,
    });

    if (existingReview) {
      return res.json({
        success: true,
        data: { canReview: false, reason: "already_reviewed", reviewId: existingReview._id },
      });
    }

    return res.json({ success: true, data: { canReview: true } });
  } catch (error) {
    next(error);
  }
};


