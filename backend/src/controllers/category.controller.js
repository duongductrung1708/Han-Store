import { Category } from "../models/category.model.js";

// Public: list all categories
export const listCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({
      isDeleted: false,
      isActive: true,
    }).sort({ name: 1 });

    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

