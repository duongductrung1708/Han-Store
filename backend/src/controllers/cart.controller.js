import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";

// Lấy giỏ hàng của current user
export const getMyCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate(
      "items.product",
    );

    res.json({
      success: true,
      data: cart || { user: req.user.id, items: [], itemsPrice: 0 },
    });
  } catch (error) {
    next(error);
  }
};

// Thêm / cập nhật 1 item trong giỏ
export const upsertCartItem = async (req, res, next) => {
  try {
    const { productId, quantity, size, color } = req.body;

    const product = await Product.findById(productId);
    if (!product || product.isDeleted || !product.isActive) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,
        items: [],
        itemsPrice: 0,
      });
    }

    const idx = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        item.size === size &&
        item.color === color,
    );

    if (idx > -1) {
      cart.items[idx].quantity = quantity;
      if (cart.items[idx].quantity <= 0) {
        cart.items.splice(idx, 1);
      }
    } else if (quantity > 0) {
      cart.items.push({ product: productId, quantity, size, color });
    }

    cart.itemsPrice = await calcCartItemsPrice(cart.items);

    await cart.save();

    const populated = await cart.populate("items.product");
    res.json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// Xóa 1 item
export const removeCartItem = async (req, res, next) => {
  try {
    const { productId, size, color } = req.body;
    
    if (!productId) {
      return res
        .status(400)
        .json({ success: false, message: "Product ID is required" });
    }

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    // Xóa item dựa trên productId, size, và color
    cart.items = cart.items.filter(
      (item) =>
        !(
          item.product.toString() === productId.toString() &&
          item.size === (size || undefined) &&
          item.color === (color || undefined)
        ),
    );
    
    cart.itemsPrice = await calcCartItemsPrice(cart.items);
    await cart.save();

    const populated = await cart.populate("items.product");
    res.json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// Xóa toàn bộ giỏ
export const clearCart = async (req, res, next) => {
  try {
    await Cart.findOneAndUpdate(
      { user: req.user.id },
      { items: [], itemsPrice: 0 },
    );
    res.json({ success: true, message: "Cart cleared" });
  } catch (error) {
    next(error);
  }
};

// Helper: tính tổng tiền giỏ
const calcCartItemsPrice = async (items) => {
  if (!items.length) return 0;

  const productIds = items.map((i) => i.product);
  const products = await Product.find({ _id: { $in: productIds } });
  const map = new Map(products.map((p) => [p._id.toString(), p]));

  return items.reduce((sum, item) => {
    const prod = map.get(item.product.toString());
    if (!prod) return sum;
    const unitPrice = prod.salePrice || prod.price;
    return sum + unitPrice * item.quantity;
  }, 0);
};


