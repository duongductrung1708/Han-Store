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

    // Build aggregation pipeline for price filtering with salePrice support
    let aggregationPipeline = [];

    // Match stage for basic filters
    const matchStage = { ...query };

    if (minPrice || maxPrice) {
      // Use aggregation to filter by effective price (salePrice || price)
      aggregationPipeline.push({ $match: matchStage });

      // Add field to calculate effective price
      aggregationPipeline.push({
        $addFields: {
          effectivePrice: {
            $cond: {
              if: { $and: [{ $ne: ["$salePrice", null] }, { $gt: ["$salePrice", 0] }] },
              then: "$salePrice",
              else: "$price",
            },
          },
        },
      });

      // Filter by effective price
      const priceFilter = {};
      if (minPrice) priceFilter.effectivePrice = { $gte: Number(minPrice) };
      if (maxPrice) {
        priceFilter.effectivePrice = priceFilter.effectivePrice || {};
        priceFilter.effectivePrice.$lte = Number(maxPrice);
      }
      aggregationPipeline.push({ $match: priceFilter });

      // Sort, skip, limit
      // If sorting by price, use effectivePrice instead
      const sortField = sort === "price" ? "effectivePrice" : sort;
      const sortOption = { [sortField]: order === "asc" ? 1 : -1 };
      aggregationPipeline.push({ $sort: sortOption });
      aggregationPipeline.push({ $skip: (page - 1) * limit });
      aggregationPipeline.push({ $limit: Number(limit) });

      // Populate categories
      aggregationPipeline.push({
        $lookup: {
          from: "categories",
          localField: "categories",
          foreignField: "_id",
          as: "categories",
        },
      });

      // Select only needed fields and remove effectivePrice
      aggregationPipeline.push({
        $project: {
          effectivePrice: 0,
          description: 0, // Don't need description in list view
          __v: 0,
        },
      });

      // Count total with same price filter
      const countPipeline = [
        { $match: matchStage },
        {
          $addFields: {
            effectivePrice: {
              $cond: {
                if: { $and: [{ $ne: ["$salePrice", null] }, { $gt: ["$salePrice", 0] }] },
                then: "$salePrice",
                else: "$price",
              },
            },
          },
        },
        { $match: priceFilter },
        { $count: "total" },
      ];

      const [itemsResult, countResult] = await Promise.all([
        Product.aggregate(aggregationPipeline),
        Product.aggregate(countPipeline),
      ]);

      const items = itemsResult;
      const total = countResult[0]?.total || 0;

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
      return;
    }

    // If no price filter but sorting by price, use aggregation to sort by effectivePrice
    if (sort === "price") {
      const aggregationPipeline = [
        { $match: query },
        {
          $addFields: {
            effectivePrice: {
              $cond: {
                if: { $and: [{ $ne: ["$salePrice", null] }, { $gt: ["$salePrice", 0] }] },
                then: "$salePrice",
                else: "$price",
              },
            },
          },
        },
        { $sort: { effectivePrice: order === "asc" ? 1 : -1 } },
        { $skip: (page - 1) * limit },
        { $limit: Number(limit) },
        {
          $lookup: {
            from: "categories",
            localField: "categories",
            foreignField: "_id",
            as: "categories",
          },
        },
        {
          $project: {
            effectivePrice: 0,
          },
        },
      ];

      const countPipeline = [{ $match: query }, { $count: "total" }];

      const [itemsResult, countResult] = await Promise.all([
        Product.aggregate(aggregationPipeline),
        Product.aggregate(countPipeline),
      ]);

      const items = itemsResult;
      const total = countResult[0]?.total || 0;

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
      return;
    }

    // If no price filter and not sorting by price, use normal query
    // Select only needed fields for better performance
    const sortOption = { [sort]: order === "asc" ? 1 : -1 };

    const [items, total] = await Promise.all([
      Product.find(query)
        .select(
          "name slug price salePrice images categories tags totalStock averageRating totalReviews variants",
        )
        .populate("categories", "name slug")
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean(), // Use lean() for better performance (returns plain JS objects)
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


