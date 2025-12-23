import { validationResult } from "express-validator";
import { Product } from "../models/product.model.js";
import { Category } from "../models/category.model.js";

// Public: list + filter + search
export const listProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      category,
      minPrice,
      maxPrice,
      sort = "createdAt",
      order = "desc",
    } = req.query;

    const query = { isDeleted: false, isActive: true };

    if (search) {
      query.$text = { $search: search };
    }

    if (category) {
      query.categories = category;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const sortOption = { [sort]: order === "asc" ? 1 : -1 };

    const [items, total] = await Promise.all([
      Product.find(query)
        .populate("categories")
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Product.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: items,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Public: chi tiết
export const getProductDetail = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    
    if (!idOrSlug) {
      return res
        .status(400)
        .json({ success: false, message: "Product ID or slug is required" });
    }

    // Check if idOrSlug is a valid ObjectId (24 hex characters)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
    
    // Build query condition
    const queryCondition = {
      isDeleted: false,
    };

    if (isValidObjectId) {
      // If it's a valid ObjectId, try both _id and slug
      queryCondition.$or = [{ _id: idOrSlug }, { slug: idOrSlug }];
    } else {
      // If it's not a valid ObjectId, only search by slug
      queryCondition.slug = idOrSlug;
    }

    const product = await Product.findOne(queryCondition).populate({
      path: "categories",
      select: "name slug",
      match: { isDeleted: false },
    });

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // Filter out null categories (if category was deleted)
    if (product.categories) {
      product.categories = product.categories.filter((cat) => cat !== null);
    }

    res.json({ success: true, data: product });
  } catch (error) {
    console.error("Error fetching product detail:", error);
    next(error);
  }
};

// Admin: tạo / cập nhật / soft delete
export const createProduct = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const payload = req.body;

    if (payload.categories?.length) {
      const count = await Category.countDocuments({
        _id: { $in: payload.categories },
      });
      if (count !== payload.categories.length) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid category IDs" });
      }
    }

    const product = await Product.create(payload);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = req.body;

    const product = await Product.findByIdAndUpdate(id, payload, {
      new: true,
    });

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true },
    );

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, message: "Product deleted" });
  } catch (error) {
    next(error);
  }
};


