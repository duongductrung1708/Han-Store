import { Cart } from "../models/cart.model.js";
import { Order } from "../models/order.model.js";
import { Voucher } from "../models/voucher.model.js";
import { User } from "../models/user.model.js";
import { sendOrderConfirmationEmail } from "../services/email.service.js";
import { getShippingFee } from "../utils/shippingFees.js";

const CANCEL_WINDOW_MINUTES = parseInt(process.env.CANCEL_WINDOW_MINUTES || "30", 10);

// Tạo đơn hàng từ giỏ + thông tin shipping + paymentMethod
export const createOrderFromCart = async (req, res, next) => {
  try {
    const {
      shippingAddress,
      paymentMethod = "COD",
      voucherCode,
      note,
      invoiceInfo,
      selectedItems,
    } = req.body;

    // Validate shippingAddress
    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: "Shipping address is required",
      });
    }

    if (!shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.street || !shippingAddress.city) {
      return res.status(400).json({
        success: false,
        message: "Shipping address must include fullName, phone, street, and city",
      });
    }

    const cart = await Cart.findOne({ user: req.user.id }).populate(
      "items.product",
    );
    if (!cart || !cart.items.length) {
      return res
        .status(400)
        .json({ success: false, message: "Cart is empty" });
    }

    const hasSelection = Array.isArray(selectedItems) && selectedItems.length > 0;
    const toKey = (item) =>
      `${item.product._id.toString()}||${item.size || ""}||${item.color || ""}`;
    const selectedKeySet = hasSelection
      ? new Set(
          selectedItems.map(
            (si) =>
              `${si.productId || si.product || ""}||${si.size || ""}||${si.color || ""}`,
          ),
        )
      : null;

    const cartItems = hasSelection
      ? cart.items.filter((item) => selectedKeySet.has(toKey(item)))
      : cart.items;

    if (!cartItems.length) {
      return res
        .status(400)
        .json({ success: false, message: "No selected items to checkout" });
    }

    let voucher = null;
    let discount = 0;

    if (voucherCode) {
      voucher = await Voucher.findOne({
        code: voucherCode.toUpperCase(),
        isDeleted: false,
        isActive: true,
        validFrom: { $lte: new Date() },
        validTo: { $gte: new Date() },
      });
      if (voucher) {
        const selectedItemsPrice = cartItems.reduce(
          (sum, item) =>
            sum + (item.product.salePrice || item.product.price) * item.quantity,
          0,
        );
        discount = calcVoucherDiscount(voucher, selectedItemsPrice);
      }
    }

    const items = cartItems.map((item) => ({
      product: item.product._id,
      name: item.product.name,
      price: item.product.salePrice || item.product.price,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      imageUrl: item.product.images?.[0]?.url,
    }));

    const itemsPrice = cartItems.reduce(
      (sum, item) =>
        sum + (item.product.salePrice || item.product.price) * item.quantity,
      0,
    );
    // Tính phí ship dựa trên province code (trụ sở ở Hà Nội)
    const shippingPrice = getShippingFee(shippingAddress.provinceCode);
    const totalPrice = itemsPrice + shippingPrice - discount;

    // Prepare shipping address with all required fields
    const shippingAddressData = {
      fullName: shippingAddress.fullName,
      phone: shippingAddress.phone,
      street: shippingAddress.street,
      city: shippingAddress.city,
      district: shippingAddress.district || undefined,
      ward: shippingAddress.ward || undefined,
      provinceCode: shippingAddress.provinceCode || undefined,
      districtCode: shippingAddress.districtCode || undefined,
      wardCode: shippingAddress.wardCode || undefined,
    };

    const order = await Order.create({
      user: req.user.id,
      items,
      shippingAddress: shippingAddressData,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      discount,
      totalPrice,
      voucher: voucher?._id,
      note: note || undefined,
      invoiceInfo: invoiceInfo || undefined,
      status: paymentMethod === "COD" ? "CONFIRMED" : "PENDING",
    });

    // Nếu có invoiceInfo và user muốn lưu, cập nhật vào user profile
    if (invoiceInfo && req.body.saveInvoiceInfo) {
      await User.findByIdAndUpdate(req.user.id, {
        invoiceInfo: {
          companyName: invoiceInfo.companyName,
          taxCode: invoiceInfo.taxCode,
          email: invoiceInfo.email,
          address: invoiceInfo.address,
        },
      });
    }

    // Remove only checked out items from cart, keep the rest
    const remainingItems = cart.items.filter((item) => !selectedKeySet || !selectedKeySet.has(toKey(item)));
    cart.items = remainingItems;
    cart.itemsPrice = remainingItems.reduce(
      (sum, item) =>
        sum + (item.product.salePrice || item.product.price) * item.quantity,
      0,
    );
    await cart.save();

    // Gửi email xác nhận đơn hàng (không block nếu lỗi)
    try {
      const user = await User.findById(req.user.id);
      if (user && user.email) {
        await sendOrderConfirmationEmail({
          email: user.email,
          name: user.name,
          orderId: order._id.toString(),
          orderDetails: order,
        });
      }
    } catch (emailError) {
      console.error("Failed to send order confirmation email:", emailError);
      // Không throw error để không ảnh hưởng đến việc tạo đơn
    }

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    console.error("Error creating order:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    next(error);
  }
};

// User: danh sách đơn hàng của chính mình
export const listMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({
      user: req.user.id,
      isDeleted: false,
    }).sort({ createdAt: -1 });

    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

// Admin: list tất cả đơn
export const listAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ isDeleted: false })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

// Admin: cập nhật trạng thái
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findById(id);
    if (!order || order.isDeleted) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    order.status = status;
    if (status === "DELIVERED") {
      order.deliveredAt = new Date();
    }

    await order.save();
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// User cancel order within time window and before shipping
export const cancelMyOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findOne({ _id: id, user: req.user.id, isDeleted: false });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status === "CANCELLED") {
      return res.status(400).json({ success: false, message: "Order already cancelled" });
    }

    if (order.status === "SHIPPING" || order.status === "DELIVERED") {
      return res
        .status(400)
        .json({ success: false, message: "Order is being delivered and cannot be cancelled" });
    }

    const diffMinutes = (Date.now() - order.createdAt.getTime()) / (1000 * 60);
    if (diffMinutes > CANCEL_WINDOW_MINUTES) {
      return res.status(400).json({
        success: false,
        message: `Bạn chỉ có thể hủy đơn trong ${CANCEL_WINDOW_MINUTES} phút sau khi đặt.`,
      });
    }

    order.status = "CANCELLED";
    order.cancelledAt = new Date();
    await order.save();

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

const calcVoucherDiscount = (voucher, itemsPrice) => {
  if (!voucher) return 0;
  if (itemsPrice < (voucher.minOrderValue || 0)) return 0;

  let discount = 0;
  if (voucher.discountType === "PERCENT") {
    discount = (itemsPrice * voucher.discountValue) / 100;
    if (voucher.maxDiscountAmount) {
      discount = Math.min(discount, voucher.maxDiscountAmount);
    }
  } else {
    discount = voucher.discountValue;
  }

  return discount;
};


