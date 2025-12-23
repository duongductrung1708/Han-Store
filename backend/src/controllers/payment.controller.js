import { Cart } from "../models/cart.model.js";
import { Order } from "../models/order.model.js";
import { User } from "../models/user.model.js";
import { createMomoPayment } from "../services/momo.service.js";
import { getShippingFee } from "../utils/shippingFees.js";

// Tạo đơn hàng từ giỏ + tạo yêu cầu thanh toán MoMo
export const createMomoPaymentFromCart = async (req, res, next) => {
  try {
    console.log("=== MoMo Payment Request ===");
    console.log("User ID:", req.user?.id);
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    
    const { shippingAddress, note, invoiceInfo, selectedItems } = req.body;

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

    const hasSelection =
      Array.isArray(selectedItems) && selectedItems.length > 0;
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
    const discount = 0;
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

    // Tạo order với trạng thái PENDING, paymentMethod = MOMO
    const order = await Order.create({
      user: req.user.id,
      items,
      shippingAddress: shippingAddressData,
      paymentMethod: "MOMO",
      itemsPrice,
      shippingPrice,
      discount,
      totalPrice,
      note: note || undefined,
      invoiceInfo: invoiceInfo || undefined,
      status: "PENDING",
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

    const orderInfo = `Thanh toan don hang #${order._id}`;

    // Gửi yêu cầu tới MoMo
    let momoRes;
    try {
      momoRes = await createMomoPayment({
        amount: totalPrice,
        orderId: order._id.toString(),
        orderInfo,
      });
    } catch (momoError) {
      console.error("MoMo payment error:", momoError);
      // Xóa order đã tạo nếu MoMo thất bại
      await Order.findByIdAndDelete(order._id);
      return res.status(500).json({
        success: false,
        message: momoError.message || "Failed to create MoMo payment",
      });
    }

    if (momoRes.resultCode !== 0) {
      // Xóa order đã tạo nếu MoMo trả về lỗi
      await Order.findByIdAndDelete(order._id);
      return res.status(400).json({
        success: false,
        message: momoRes.message || "Failed to create MoMo payment",
        momoRes,
      });
    }

    // Remove checked-out items from cart, keep the rest
    const remainingItems = cart.items.filter((item) => !selectedKeySet || !selectedKeySet.has(toKey(item)));
    cart.items = remainingItems;
    cart.itemsPrice = remainingItems.reduce(
      (sum, item) =>
        sum + (item.product.salePrice || item.product.price) * item.quantity,
      0,
    );
    await cart.save();

    // Trả payUrl cho FE redirect
    return res.json({
      success: true,
      data: {
        orderId: order._id,
        payUrl: momoRes.payUrl,
      },
    });
  } catch (error) {
    console.error("Error creating MoMo payment from cart:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    next(error);
  }
};

// IPN do MoMo gọi về để xác nhận thanh toán
export const handleMomoIpn = async (req, res, next) => {
  try {
    const { orderId, resultCode, message } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (Number(resultCode) === 0) {
      order.status = "CONFIRMED";
      order.paymentInfo = {
        provider: "MOMO",
        transactionId: req.body.transId,
        status: "PAID",
      };
      await order.save();
    } else {
      order.status = "CANCELLED";
      order.paymentInfo = {
        provider: "MOMO",
        transactionId: req.body.transId,
        status: "FAILED",
      };
      await order.save();
    }

    // MoMo yêu cầu trả về code 0 nếu xử lý thành công
    return res.json({ resultCode: 0, message: "IPN received" });
  } catch (error) {
    next(error);
  }
};


